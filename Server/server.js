import Fastify from 'fastify'
import { supabase } from './Supabase/supabase.js'

const app = Fastify({ logger: true })

const IpTest = "https://blog-disbelief-region.ngrok-free.dev"
const metadados = ["l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8", "l9", "l10"]

const starting = async () => {
    const port = process.env.PORT || 3333
    try {
        await app.listen({ port: Number(port), host: '0.0.0.0' })
        console.log(`[SERVIDOR] Executando na porta: ${port}`)
    } catch (error) {
        app.log.error(error)
    }
}

// ROTA: Leitura periódica dos LDRs
app.post("/home", async (req, rep) => {
    try {
        const dataLdr = req.body?.LDRState
        const mac = req.body?.mac
        const ip = req.body?.ip || req.ip

        if (dataLdr && mac) {
            await saveData(dataLdr, mac, ip)
        } else {
            console.log("[HOME] Payload incompleto recebido:", req.body)
        }

        return rep.status(200).send({ ligar: 2, estado: 1, servPin: 34, graus: 180 })
    } catch (error) {
        app.log.error("Erro na rota /home:", error.message)
        return rep.status(500).send({ error: "Erro interno no servidor" })
    }
})

// ROTA: Registro inicial do IP (Verifica se já existe antes de inserir)
app.post("/register-ip", async (req, rep) => {
    const { mac, ip } = req.body || {}

    if (!mac || !ip) {
        return rep.status(400).send({ error: "MAC e IP são obrigatórios" })
    }

    try {
        const { data: registroExistente, error: erroBusca } = await supabase
            .from("IPs")
            .select("mac")
            .eq("mac", mac)
            .maybeSingle()

        if (erroBusca) {
            app.log.error("Erro ao consultar MAC no banco:", erroBusca.message)
            return rep.status(500).send({ error: "Erro ao verificar registro" })
        }

        if (registroExistente) {
            console.log(`[REGISTRO] MAC ${mac} já cadastrado no banco. Nenhuma ação necessária.`)
            return rep.status(200).send({
                success: true,
                message: "Dispositivo já cadastrado"
            })
        }

        const { data, error: erroInsercao } = await supabase
            .from("IPs")
            .insert([{ mac: mac, ip: ip }])
            .select()

        if (erroInsercao) {
            app.log.error("Erro ao inserir registro:", erroInsercao.message)
            return rep.status(500).send({ error: "Falha ao registrar novo dispositivo" })
        }

        console.log(`[REGISTRO] Novo dispositivo inserido! MAC: ${mac} | IP: ${ip}`)
        return rep.status(201).send({
            success: true,
            message: "Dispositivo registrado com sucesso",
            data: data
        })

    } catch (error) {
        app.log.error("Exceção na rota /register-ip:", error.message)
        return rep.status(500).send({ error: "Erro interno no servidor" })
    }
})

// ROTA: Autenticação de Senha
app.post("/pass", async (req, rep) => {
    const mac = req.body?.mac
    const passe = req.body?.pass

    try {
        const { data, error } = await supabase
            .from("userequips")
            .select("passe")
            .eq("passe", passe)
            .maybeSingle()

        if (error) throw error

        const senhaAdmin = await pushAdmin(mac)

        if (data && data.passe) {
            return rep.send({ senhaUser: data.passe, senhaAdm: senhaAdmin || "" })
        } else if (senhaAdmin && senhaAdmin === passe) {
            return rep.send({ senhaUser: "", senhaAdm: senhaAdmin })
        } else {
            return rep.send({ senhaUser: "", senhaAdm: "" })
        }
    } catch (error) {
        app.log.error("Erro ao buscar senhas:", error.message)
        return rep.status(500).send({ senhaAdm: "", senhaUser: "" })
    }
})

// ROTA: Atualizar a Senha ADM (Tabela 'IPs')
app.post("/update", async (req, rep) => {
    const novaSenha = req.body?.pass
    const mac = req.body?.mac

    if (!mac || !novaSenha) {
        return rep.status(400).send({ confirm: false, pass: null })
    }

    try {
        // Atualiza passAdmin na tabela IPs associada ao MAC do ESP32
        const { error } = await supabase
            .from("IPs")
            .update({ passAdmin: novaSenha })
            .eq("mac", mac)

        if (error) throw error

        return rep.send({
            confirm: true,
            pass: novaSenha
        })
    } catch (error) {
        app.log.error("Erro no update da senha ADM:", error.message)
        return rep.status(500).send({
            confirm: false,
            pass: null
        })
    }
})

// ROTA: Ativar e Salvar no Histórico
app.post("/push", async (req, rep) => {
    const senha = req.body?.pass

    if (!senha) {
        return rep.status(400).send({ error: "Senha não fornecida" })
    }

    try {
        const { data, error: erroTake } = await supabase
            .from("userequips")
            .select("equipes(equipeid), usuarios(user)")
            .eq("passe", senha)
            .maybeSingle()

        if (erroTake) throw erroTake

        const user = data?.usuarios?.user || "Admin"
        const equipe = data?.equipes?.equipeid

        const { error } = await supabase
            .from("historico")
            .insert([
                {
                    user: user,
                    from: "Físico",
                    descricao: "Sistema Ativado",
                    equipid: equipe
                }
            ])

        if (error) throw error

        return rep.send({
            confirm: "Sistema ativado com sucesso pelo Node!"
        })
    } catch (error) {
        app.log.error("Erro ao registrar histórico:", error.message)
        return rep.status(500).send({ error: "Falha ao salvar historico" })
    }
})

// Busca a senha Admin cadastrada para o MAC
const pushAdmin = async (mac) => {
    if (!mac) return ""
    try {
        const { data, error } = await supabase
            .from("IPs")
            .select("passAdmin")
            .eq("mac", mac)
            .maybeSingle()

        if (error) throw error
        return data?.passAdmin || "" // Previne crash se data for null
    } catch (error) {
        app.log.error("Erro no pushAdmin:", error.message)
        return ""
    }
}

// Atualiza leituras LDR e IP
const saveData = async (ldr, mac, ip) => {
    if (!ldr || !Array.isArray(ldr) || !mac) {
        console.log("[SAVE DATA] Dados ausentes/inválidos")
        return
    }

    const rawData = ldr.map((val, index) => ({
        [metadados[index]]: val
    }))
    const dataReal = Object.assign({}, ...rawData)

    try {
        const { data, error } = await supabase
            .from("IPs")
            .update({ "ldr": dataReal, "ip": ip })
            .eq("mac", mac)
            .select()

        if (error) console.error("Erro no saveData:", error.message)
        else console.log("[SAVE DATA] Atualizado:", data)
    } catch (error) {
        console.error("Exceção saveData:", error)
    }
}

// Realtime
supabase
    .channel("db-changes")
    .on('postgres_changes', { event: "UPDATE", schema: "public", table: "IPs", filter: "confirm=eq.true" }, async payload => {
        console.log(`[REALTIME] Trigger em confirm para o IP: ${payload.new.ip}`)
        const IP = payload.new.ip
        await removeConfirm(IP, IpTest)
    })
    .subscribe()

async function handleConfirm(ip) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const payload = { "pino": 13 }

    try {
        const response = await fetch(`${ip}/led`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
            body: JSON.stringify(payload),
            signal: controller.signal
        })
        console.log("[HANDLE CONFIRM] Status ESP:", response.status)
        const returnData = await response.json()
        console.log("[HANDLE CONFIRM] Dados ESP:", returnData)
    } catch (error) {
        console.log(`[HANDLE CONFIRM] Erro ao chamar ESP: ${error.message}`)
    } finally {
        clearTimeout(timeout)
    }
}

const removeConfirm = async (ip, IPComplex) => {
    try {
        const { data } = await supabase
            .from("IPs")
            .update({ 'confirm': false })
            .eq('ip', ip)
            .eq('confirm', true)
            .select()

        if (data && data.length > 0) {
            await handleConfirm(IPComplex)
        }
    } catch (error) {
        console.log("Erro no removeConfirm:", error)
    }
}

starting()

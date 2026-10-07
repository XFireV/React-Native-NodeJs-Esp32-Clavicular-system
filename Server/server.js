import Fastify from 'fastify'
import { supabase } from './Supabase/supabase.js'

const app = Fastify({ logger: true })

const NGROK_ESP32_URL = "https://blog-disbelief-region.ngrok-free.dev"

const metadados = ["l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8", "l9", "l10"]

const starting = async () => {
    const port = process.env.PORT || 3333
    try {
        await app.listen({ port: Number(port), host: '0.0.0.0' })
        console.log(`[SERVIDOR RENDER] Executando na porta: ${port}`)
    } catch (error) {
        app.log.error(error)
    }
}

// BUSCA SENHA ADMIN (Evita erro 'pushAdmin is not defined')
const pushAdmin = async (mac) => {
    if (!mac) return null
    try {
        const { data, error } = await supabase
            .from("IPs")
            .select("passAdmin")
            .ilike("mac", mac)
            .maybeSingle()

        if (error) throw error
        return data?.passAdmin || null
    } catch (error) {
        console.error("[PUSH ADMIN] Erro ao buscar senha Admin:", error.message)
        return null
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

// ROTA: Registro inicial do IP
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
    const passeString = req.body?.pass 
    const passeNum = Number(passeString) 

    try {
        const { data, error } = await supabase
            .from("userequips")
            .select("passe")
            .eq("passe", passeNum)
            .limit(1)
            .maybeSingle()

        if (error) throw error

        const senhaAdminRaw = await pushAdmin(mac)
        
        const dbPasseStr = data?.passe ? String(data.passe) : ""
        const adminPasseStr = senhaAdminRaw ? String(senhaAdminRaw) : ""

        console.log(`[PASS] Recebido: '${passeString}' | BD User: '${dbPasseStr}' | BD Admin: '${adminPasseStr}'`)

        if (dbPasseStr && dbPasseStr === passeString) {
            return rep.send({ senhaUser: dbPasseStr, senhaAdm: adminPasseStr })
        } else if (adminPasseStr && adminPasseStr === passeString) {
            return rep.send({ senhaUser: "", senhaAdm: adminPasseStr })
        } else {
            return rep.send({ senhaUser: "", senhaAdm: "" })
        }
    } catch (error) {
        app.log.error(error, "Erro ao buscar senhas na rota /pass")
        return rep.status(500).send({ senhaAdm: "", senhaUser: "" })
    }
})

// ROTA: Atualizar a Senha ADM
app.post("/update", async (req, rep) => {
    const novaSenhaStr = req.body?.pass
    const mac = req.body?.mac

    if (!mac || !novaSenhaStr) {
        return rep.status(400).send({ confirm: false, pass: null })
    }

    try {
        const novaSenhaNum = Number(novaSenhaStr) 

        const { error } = await supabase
            .from("IPs")
            .update({ passAdmin: novaSenhaNum })
            .ilike("mac", mac)

        if (error) throw error

        return rep.send({
            confirm: true,
            pass: novaSenhaStr
        })
    } catch (error) {
        app.log.error(error, "Erro no update da senha ADM")
        return rep.status(500).send({ confirm: false, pass: null })
    }
})

// ROTA: Ativar e Salvar no Histórico
app.post("/push", async (req, rep) => {
    const dados = { "equipe": null, "user": null, "opentime": 10000, "ip": null, "skipHistorico": false, "from": "null" }
    const raw = req.body?.pass
    const mac = req.body?.mac
    const user = req.body?.user
    const from = req.body?.from

    try {
        if (user != null && from != null) {
            const { data, error } = await supabase
                .from("usuarios")
                .select("userequips(equipid)")
                .eq("user", user)
                .single()

            if (error) throw error

            let dataUs = null;
            if (data?.userequips) {
                dataUs = Array.isArray(data.userequips) ? data.userequips[0]?.equipid : data.userequips.equipid;
            }

            console.log(dataUs)
            console.log(from)
            console.log(user)
            
            if (dataUs) {
                dados.equipe = dataUs
                dados.user = user
                dados.from = "Facial"
            } else {
                return rep.status(404).send({ error: "Usuário sem equipe vinculada" })
            }

            const { data: equipD, error: equipE } = await supabase
                .from("equipes")
                .select("opentime")
                .eq("id", dados.equipe)
                .single()

            if (!equipE && equipD) {
                dados.opentime = equipD.opentime
            }
        } else {
            const senha = typeof raw === 'string' ? Number(raw) : raw

            if (String(senha).length !== 8) {
                return rep.status(400).send({ error: "Senha excedente ou impossível" })
            }
            if (!senha) {
                return rep.status(400).send({ error: "Senha não fornecida" })
            }

            const { data, error: erroTake } = await supabase
                .from("userequips")
                .select("equipes(id, opentime), usuarios(user)")
                .eq("passe", senha)
                .single()

            if (erroTake) {
                if (erroTake.code === "PGRST116") {
                    try {
                        const { error: errorAdm, data: dataAdm } = await supabase
                            .from("IPs")
                            .select("id") 
                            .ilike("mac", mac)
                            .eq("passAdmin", senha)
                            .single()

                        if (errorAdm) {
                            if (errorAdm.code === "PGRST116") {
                                app.log.error("Senha inválida ou MAC não associado a um Admin:", errorAdm.message)
                                return rep.status(401).send({ error: "Senha incorreta ou acesso negado" })
                            } else {
                                throw errorAdm
                            }
                        }

                        if (dataAdm) {
                            dados.user = "Administrador"

                            const { data: dataEq, error: errorEq } = await supabase
                                .from("equipes")
                                .select("id, opentime, ip")
                                .ilike("mac", mac)
                                .maybeSingle()

                            if (errorEq || !dataEq) {
                                dados.opentime = 10000
                                dados.skipHistorico = true
                            } else {
                                dados.equipe = dataEq.id
                                dados.ip = dataEq.ip
                                dados.from = "Físico"
                                if (dataEq.opentime != null) {
                                    dados.opentime = dataEq.opentime
                                }
                            }
                        }
                    } catch (errCatchAdm) {
                        app.log.error("Exceção na busca do Admin:", errCatchAdm?.message || errCatchAdm)
                        return rep.status(401).send({ error: "((Senha incorreta))" })
                    }
                } else {
                    throw erroTake
                }
            } else {
                dados.user = data?.usuarios?.user || "Usuário"
                dados.equipe = data?.equipes?.id || null
                dados.from = "Físico"
                const sketchT = data?.equipes?.opentime
                if (sketchT != null) dados.opentime = sketchT
            }
        }

        if (!dados.skipHistorico) {
            await pushAtive(mac)
            const { error: erroInsert } = await supabase
                .from("historico")
                .insert([{
                    user: dados.user,
                    from: dados.from,
                    descricao: "Sistema Ativado",
                    equipid: dados.equipe
                }])

            if (erroInsert) throw erroInsert

            return rep.send({
                confirm: dados.from === "Facial" ? "Sistema ativado pelo facial" : "Sistema ativado com sucesso pelo Node!",
                opentime: dados.opentime,
                ip: dados.ip
            })
        } else {
            app.log.info("Ativação de Admin sem equipe: Histórico ignorado.")
            return rep.send({
                confirm: "Sistema ativado com sucesso pelo Node (Admin)!",
                opentime: dados.opentime,
                ip: dados.ip
            })
        }
    } catch (error) {
        app.log.error("Erro ao registrar histórico:", error?.message || error)
        return rep.status(500).send({ error: "Falha ao salvar historico" })
    }
})

const pushAtive = async (mac) => {
    if (!mac) return ""
    try {
        await supabase
            .from("IPs")
            .update({ "ativo": true })
            .ilike("mac", mac) 
    } catch (error) {
        app.log.error(error, "Erro no pushAtive")
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

// REALTIME: Escuta alterações na coluna `confirm`
supabase
    .channel("db-changes")
    .on('postgres_changes', { 
        event: "UPDATE", 
        schema: "public", 
        table: "IPs", 
        filter: "confirm=eq.true" 
    }, async payload => {
        console.log(`[REALTIME] Trigger confirm disparado para MAC: ${payload.new.mac}`)
        const macEsp = payload.new.mac
        
        if (macEsp) {
            await removeConfirm(macEsp)
        }
    })
    .subscribe()

// Dispara o acionamento para o ESP32 via Ngrok
async function handleConfirm(openT) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 7000)
    const payload = { "ative": true, "time": openT }

    // Rota pública do Ngrok direcionada para o ESP32
    const urlFinal = `${NGROK_ESP32_URL}/led`

    try {
        console.log(`[HANDLE CONFIRM] Disparando POST para Ngrok: ${urlFinal} com time=${openT}`)
        const response = await fetch(urlFinal, {
            method: "POST",
            headers: { 
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true' 
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        })
        console.log("[HANDLE CONFIRM] Status resposta do Ngrok/ESP:", response.status)
        const returnData = await response.json()
        console.log("[HANDLE CONFIRM] Dados retornados pelo ESP:", returnData)
    } catch (error) {
        console.log(`[HANDLE CONFIRM] Erro ao chamar ESP via Ngrok: ${error.message}`)
    } finally {
        clearTimeout(timeout)
    }
}

const removeConfirm = async (mac) => {
    try {
        const { data, error } = await supabase
            .from("IPs")
            .update({ 'confirm': false })
            .eq("mac", mac)
            .eq('confirm', true)
            .select()

        if (error) {
            console.error("Erro na query do removeConfirm:", error.message)
            return
        }

        if (data && data.length > 0) {
            const openTime = await takeTimeout(mac)
            
            await handleConfirm(openTime)
        } else {
            console.log("[REMOVE CONFIRM] Nenhuma linha atualizada (confirm=true não encontrado).")
        }
    } catch (error) {
        console.log("Erro no removeConfirm:", error)
    }
}

const takeTimeout = async (mac) => {
    const tempoPadrao = 5000; 
    if (!mac) return tempoPadrao;

    try {
        const { data, error } = await supabase
            .from("equipes")
            .select("opentime")
            .eq("mac", mac)
            .maybeSingle()

        if (error) throw error

        return data?.opentime || tempoPadrao; 
    } catch (error) {
        console.error("[TAKE TIMEOUT] Erro ao buscar tempo:", error.message)
        return tempoPadrao;
    }
}

starting()

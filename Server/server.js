import Fastify from 'fastify'
import { supabase } from './Supabase/supabase.js'
const app = Fastify({logger: true})

const IpTest = "https://floyd-hygiene-antivirus-rec.trycloudflare.com"

const metadados = ["l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8", "l9", "l10"]

const starting = async() => {
    const port = process.env.PORT || 3333

    try {
        await app.listen({ port: Number(port), host: '0.0.0.0' })
        console.log(`port: ${port}`)
    } catch (error) {
        app.log.error(error)
    }
}

app.post("/home", async(req, rep) => {
    const dataLdr = req.body.LDRState
    console.log(req.body, req.ip)
    await saveData(dataLdr ,req.body.mac)
    return {ligar: 2, estado: 1, servPin: 34, graus: 180}
})

// 1. Rota para Buscar Senhas no Banco
app.post("/pass", async(req, rep) => {
    const mac = req.body.mac;
    
    try {
        // Busca a senhaAdm e senhaUser na tabela userequips onde o mac bate
        const { data, error } = await supabase
            .from("userequips")
            .select("senhaAdm, senhaUser")
            .eq("mac", mac)
            .single(); // Retorna apenas 1 objeto em vez de array

        if (error) throw error;

        return rep.send({ 
            senhaAdm: data.senhaAdm,
            senhaUser: data.senhaUser 
        });
    } catch (error) {
        app.log.error("Erro ao buscar senhas:", error.message);
        // Retorna senhas vazias ou erro para o ESP32 tratar
        return rep.status(500).send({ senhaAdm: "", senhaUser: "" });
    }
})

// 2. Rota para Atualizar a Senha ADM
app.post("/update", async(req, rep) => {
    const novaSenha = req.body.pass;
    const mac = req.body.mac;
    
    try {
        // Atualiza a coluna senhaAdm da tabela userequips
        const { error } = await supabase
            .from("userequips")
            .update({ senhaAdm: novaSenha })
            .eq("mac", mac);

        if (error) throw error;

        return rep.send({ 
            confirm: true, 
            pass: novaSenha 
        });
    } catch (error) {
        app.log.error("Erro no update da senha ADM:", error.message);
        return rep.send({ 
            confirm: false, 
            pass: null 
        });
    }
})

// 3. Rota para Ativar e Salvar no Histórico
app.post("/push", async(req, rep) => {
    const senha = req.body.pass;
    const mac = req.body.mac;
    
    try {
        // Insere um novo registro na tabela historico
        const { error } = await supabase
            .from("historico")
            .insert([
                { 
                  mac: mac, 
                  acao: "Sistema Ativado", 
                  senha_utilizada: senha, 
                  // data_hora é preenchido pelo default(now()) do próprio Supabase, 
                  // mas você pode enviar daqui se quiser: data_hora: new Date()
                }
            ]);

        if (error) throw error;

        return rep.send({ 
            confirm: "Sistema ativado com sucesso pelo Node!" 
        });
    } catch (error) {
        app.log.error("Erro ao registrar histórico:", error.message);
        return rep.status(500).send({ error: "Falha ao salvar historico" });
    }
})

starting()

const canal = supabase
    .channel("db-changes")
    .on('postgres_changes', {event: "UPDATE", schema: "public", table: "IPs", filter: "confirm=eq.true"}, async payload => {
        console.log(`payload: ${payload.new.ip}`)
        const IP = payload.new.ip
        //const IPComplex = `http://${IP}` (uso real)
        //await removeConfirm(IP, IPComplex)

        await removeConfirm(IP, IpTest)
        })
    .subscribe()

async function handleConfirm(ip) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const payload = {"pino": 13}

    try {
        const response = await fetch(`${ip}/led`, {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload),
            signal: controller.signal
        })
        console.log(response.status)
        const returnData = await response.json()
        console.log("Esp Data: ", returnData)
    } catch (error) {
        console.log(`erro: ${error}`)
    } finally {clearTimeout(timeout)}
}

const saveData = async(ldr, mac) => {
    const rawData = ldr.map((i, index) => {
        return {
            [metadados[index]] : i
        }
    })
    const dataReal = Object.assign({}, ...rawData)
    try {
        const {data} = await supabase.from("IPs").update({"ldr": dataReal}).eq("mac",mac).select()
        console.log(data)
    } catch(error) {
        console.log(error)
    }
}

const removeConfirm = async(ip, IPComplex) => {
    try {
    const {data} = await supabase.from("IPs").update({'confirm': false}).eq('ip', ip).eq('confirm', true).select()
    if(data && data.length > 0) await handleConfirm(IPComplex)
    } catch (error) {
        console.log(error)
    }
}

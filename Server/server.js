import Fastify from 'fastify'
import { supabase } from './Supabase/supabase.js'
const app = Fastify({logger: true})

const IpTest = "https://blog-disbelief-region.ngrok-free.dev "

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
    await saveData(dataLdr ,req.body.mac, req.body.ip)
    return {ligar: 2, estado: 1, servPin: 34, graus: 180}
})

// 1. Rota para Buscar Senhas no Banco
app.post("/pass", async(req, rep) => {
    const mac = req.body.mac;
    const passe = req.body.pass
    
    try {
        const { data, error } = await supabase
            .from("userequips")
            .select("passe")
            .eq("passe",passe)
            .single(); 

        if (error) throw error;

        if(!data.passe) {
            const senha = await pushAdmin(mac)
            if(senha) return rep.send({ senhaUser: data.passe, senhaAdm: senha });
        }
    } catch (error) {
        app.log.error("Erro ao buscar senhas:", error.message);
        return rep.status(500).send({ senhaAdm: "", senhaUser: "" });
    }
})

// atualizar a senha ADM
app.post("/update", async(req, rep) => {
    const novaSenha = req.body.pass;
    const mac = req.body.mac;
    
    try {
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

// ativar e Salvar no Histórico
app.post("/push", async(req, rep) => {
    const senha = req.body.pass;
    const mac = req.body.mac;

    try {
        const { data, error: erroTake } = await supabase
            .from("userequips")
            .select("equipes(equipeid), usuarios(user)")
            .eq("passe", senha)
            .maybeSingle()

        if(erroTake) throw erroTake
        
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

const pushAdmin = async(mac) => {
    try {
        const{data, error} = await supabase
            .from("IPs")
            .select("passAdmin")
            .eq("mac", mac)
            .single()

        if(error) throw error
        if(!data.passAdmin) return ""  
        return data.passAdmin

    } catch(error){
        app.log.error("erro: ", error.message)
    }
}

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

const saveData = async(ldr, mac, ip) => {
    const rawData = ldr.map((i, index) => {
        return {
            [metadados[index]] : i
        }
    })
    const dataReal = Object.assign({}, ...rawData)
    try {
        const {data} = await supabase.from("IPs").update({"ldr": dataReal, "ip": ip}).eq("mac",mac).select()
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

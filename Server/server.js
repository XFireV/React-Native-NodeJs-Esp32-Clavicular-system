import Fastify, { fastify } from 'fastify'
import { supabase } from './Supabase/supabase.js'
const app = fastify({logger: true})

const IpTest = "https://floyd-hygiene-antivirus-rec.trycloudflare.com"

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
    console.log(req.body, req.ip)
    return {ligar: 2, estado: 1}
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

const removeConfirm = async(ip, IPComplex) => {
    try {
    const {data} = await supabase.from("IPs").update({'confirm': false}).eq('ip', ip).eq('confirm', true).select()
    if(data && data.length > 0) await handleConfirm(IPComplex)
    } catch (error) {
        console.log(error)
    }
}

import Fastify, { fastify } from 'fastify'
import { supabase } from './Supabase/supabase'
const app = fastify({logger: true})

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
    .on('postgres_changes', {event: "UPDATE", schema: "PUBLIC", table: "IPS"}, async payload => {
        const IP = payload.new.ip
        const {data, error} = await supabase.from("IPs").update({'confirm': false}).eq('ip', IP).eq('confirm', true).select()
        if(data && data.length() > 0) espHttpSelected()
        })
    .subscribe()

const espHttpSelected = async() => {
    
}

const openDoor = async() => {
    const {data, error} = supabase
    .from("IPs")
    .select('ip, confirm')
    .
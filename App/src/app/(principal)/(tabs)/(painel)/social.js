import { createContext, useState, useEffect, useContext } from 'react'
import { supabase } from '../../../../supaBase/supa'
import { router, useRouter } from 'expo-router'
import { appContext } from '../../../../context/appContext'
import { Alert, StyleSheet, ScrollView, TouchableOpacity, Text, View, TextInput, Image } from 'react-native'
import ProfileModal from '../(user)/ProfileModal';

export default function Social() {
    const { enterEquip, setCreatingEquip, myEquip, allEquips, equipPage, setEquipAtualId,
    requestEntrance, usuarioL, userId, users, friends, enteringEquip } = useContext(appContext)
    const [textoBusca, setTextoBusca] = useState('')
    const [resultados, setResultados] = useState([])
    const [carregando, setCarregando] = useState(false)
    const [amigos, setAmigos] = useState([])
    
    const [modalVisible, setModalVisible] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)

    useEffect(() => {
        if (textoBusca.trim() === '') {
            setResultados([]);
            return;
        }
        const delayBusca = setTimeout(async () => {
            setCarregando(true)

            const { data: dataEquipes, error: errorEquipes } = await supabase
                .from('equipes')
                .select('id, equipe') 
                .ilike('equipe', `%${textoBusca}%`)
                .limit(4)

            const { data: dataUsuarios, error: errorUsuarios } = await supabase
                .from('usuarios')
                .select('id, user, avatares')
                .ilike('user', `%${textoBusca}%`)
                .limit(4)

            const listaEquipes = dataEquipes || []
            let listaUsuarios = dataUsuarios || []
            listaUsuarios = listaUsuarios.map(item => {
                let url = null
                if (item.avatares) {
                    const {data} = supabase.storage
                        .from('avatar')
                        .getPublicUrl(item.avatares)
                    url = data.publicUrl
                }
                return {
                    ...item, publicUrl: url
                }
            })

            setResultados([...listaEquipes, ...listaUsuarios]) 
            setCarregando(false);
        }, 500)
        return () => clearTimeout(delayBusca)
    }, [textoBusca])
    
    useEffect(() => {
    if (!userId) return;

    const atualizarAmigos = async () => {
        const lista = await friends();
        setAmigos(lista);
    };

    atualizarAmigos()

    const canalAmizades = supabase
        .channel(`sync-amigos-${userId}`)
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'contatos' }, 
            () => atualizarAmigos()
        )
        .subscribe();

    return () => { supabase.removeChannel(canalAmizades); };
}, [userId]);

    return (
        <View style={{ flex: 1, backgroundColor: 'rgb(3, 8, 26)', paddingTop: 40 }}>
            
            <View style={{ paddingHorizontal: 20, zIndex: 10 }}>
                <TextInput
                    placeholder='Buscar usuários ou equipes...'
                    placeholderTextColor="gray"
                    style={styles.searchInp}
                    value={textoBusca} 
                    onChangeText={setTextoBusca} 
                />
                
                {resultados.length > 0 && (
                    <View style={styles.dropdownResults}>
                        {resultados.map((item, index) => {
                            let image = require('../../../../assets/profile.jpg')
                            let imageString = image
                            if (item.user && item.publicUrl) {
                                image = { uri: `${item.publicUrl}?t=${new Date().getTime()}` }
                                imageString = `${item.publicUrl}?t=${new Date().getTime()}`
                            }

                            return (
                            <TouchableOpacity 
                                key={index} 
                                style={styles.resultItem} 
                                onPress={() => {
                                    if (item.user) {
                                        setSelectedUser({
                                            member: item.user,
                                            image: imageString,
                                            userReference: item.id
                                        })
                                        setModalVisible(true);
                                    }
                                }}>
                                {item.user ? (
                                    <View style = {{flexDirection: 'row'}}>
                                        <Image
                                            source={image} 
                                            style={styles.preview}/>
                                        <Text style={styles.resultText}>  {item.user}</Text>
                                        {item.equipe && <Text style={styles.resultSubText}>Equipe: {item.equipe}</Text>}
                                    </View>
                                ) : (
                                    <View>
                                        <Text style={styles.resultText}>🛡️ {item.equipe}</Text>
                                        <Text style={styles.resultSubText}>Equipe</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            )})}
                    </View>
                )}
            </View>

            <ScrollView style={{ flexGrow: 1, flexDirection: 'column' }}>
                {amigos.length > 0 && amigos.map((item, index) => (
                    <View key={index} style={{ padding: 15, borderBottomWidth: 1, borderColor: '#333', marginTop: 10 }}>
                        <TouchableOpacity 
                            style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 18 }} 
                            onPress={() => {
                                if (item.nome || item.user) {
                                    setSelectedUser({
                                        member: item.nome || item.user,
                                        image: item.publicUrl,
                                        userReference: item.id
                                    })
                                    setModalVisible(true);
                                }}}>
                            <Image 
                                source={item.publicUrl ? { uri: item.publicUrl } : require('../../../../assets/profile.jpg')} 
                                style={{ width: 44, height: 44, borderRadius: 22 }} />
                            <Text style={{ color: 'white', fontSize: 18, marginLeft: 15 }}>
                                {item.nome}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ))}
                {allEquips.map((item) => (
                    <View style={styles.cardP} key={item.id}>
                        <Text style={styles.teamNameText}>{item.nome}</Text>
                        <View style={styles.but}>
                            <TouchableOpacity 
                                style={styles.equipbt} 
                                onPress={() => enteringEquip(item.nome, usuarioL, userId, item.id)}
                            >
                                <Text style={styles.equiptx}>{item.entrada ? 'solicitar' : 'entrar'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
                
                <View style={{ justifyContent: 'center', marginVertical: 30 }}>
                    <TouchableOpacity style={styles.floatBot} onPress={() => router.replace('/creatingEquip')}>
                        <Text style={{ fontWeight: 'bold' }}>Criar equipe</Text>
                    </TouchableOpacity> 
                </View>
            </ScrollView>

            {selectedUser && (
                <ProfileModal 
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    member={selectedUser.member}
                    image={selectedUser.image}
                    userReference={selectedUser.userReference}
                    userId={userId} 
                />
            )}
        </View>
    );
} 

const styles = StyleSheet.create({
    searchInp: { 
        borderColor: 'black', 
        borderWidth: 1, 
        paddingHorizontal: 20, 
        paddingVertical: 15, 
        borderRadius: 20,
        backgroundColor: 'white',
        color: 'black'
    },
    preview: { borderRadius: 20, width: 40, height: 40 },
    dropdownResults: {
        position: 'absolute', 
        top: 65,
        left: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        elevation: 5, 
        zIndex: 100,
        overflow: 'hidden'
    },
    resultItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    resultText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'black'
    },
    resultSubText: {
        fontSize: 12,
        color: 'gray'
    },
    but: { flex: 1, alignItems: 'flex-end', paddingRight: 10 },
    cardP: {
        backgroundColor: 'rgb(255, 255, 255)',
        maxWidth: '86%',
        marginHorizontal: '7%',
        marginTop: 15,
        borderRadius: 15,
        flexDirection: 'row',  
        alignItems: 'center',     
        paddingLeft: 15,  
        minHeight: 80,  
    },    
    teamNameText: { fontSize: 22, textAlign: 'left', flex: 1, color: 'black' },
    floatBot: { alignSelf: 'center', backgroundColor: 'yellow', borderRadius: 10, borderWidth: 1, borderColor: 'black', padding: 15 },
    equipbt: { borderRadius: 10, backgroundColor: 'black', padding: 8 },
    equiptx: { color: 'white', fontSize: 20 },
})
import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Image ,Text, TextInput, TouchableOpacity, View, Modal } from 'react-native'
import { useContext } from 'react';
import { appContext } from '../../../../context/appContext'
import { Redirect, router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../../../../supaBase/supa'
import { Dropdown } from 'react-native-element-dropdown'
import { FontAwesome } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import * as ImagePicker from 'expo-image-picker'
import ProfileModal from '../(user)/ProfileModal'

export default function Equip() {
const {users, myEquip, equipAtualId, usuarioL, equipPage, myEquips, sendAlerta, 
userId, sendMessage, equipeName, solicitacoesEquipe, acceptSolicitation, cargos} = useContext(appContext)
const [userconfig, setUserConfig] = useState(false)
const [positionClick, setPositionClick] = useState({'x': 0, 'y': 0})

const equipIp = myEquip.find(item => item.ip === equipAtualId)
const equipAlvo = equipIp?.ip
const [userReference, setUserReference] = useState('')
const [promotions, setPromotions] = useState({
    promotion: null, relegation: null
})
const [opnePendent, setOpenPendent] = useState(false)
const [expulsar, setExpulsar] = useState(false)
const [cargoSuperior, setCargoSuperior] = useState()
const [cargoInferior, setCargoInferior] = useState()
const usuarioAtual = users.find(item => item.user === usuarioL)
const [image, setImage] = useState(null)
const [profile, setProfile] = useState(false)
const meuCargo = usuarioAtual ? usuarioAtual.cargo : '';
const [cargo, setCargo] = useState(null)
const [ member, setMember] = useState(null)
const [gerenciar, setGerenciar] = useState(false)
const [openMembers, setOpenMembers] = useState(false)
const [messageText, setMessageText] = useState('')
const [chatMessages, setChatMessages] = useState([]);

useEffect(() => {
    if (!equipAtualId) return;

    const canalDaEquipe = supabase
      .channel(`sync-equipe-${equipAtualId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'userequips', filter: `equipid=eq.${equipAtualId}` },
        (payload) => {
          equipPage(equipAtualId);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(canalDaEquipe);
    }
}, [equipAtualId])


useEffect(() => {
    if (!equipAtualId) return;

    const carregarChat = async () => {
        try {
            const { data, error } = await supabase
                .from('chat')
                .select('id, message, userid, created_at')
                .eq('equipid', equipAtualId)
                .order('created_at', { ascending: true })

            if (error) throw error;
            if (data) setChatMessages(data);
        } catch (error) {
            console.error("Erro ao carregar chat:", error.message);
        }
    }

    carregarChat();

    const canalChat = supabase
        .channel(`chat-equipe-${equipAtualId}`)
        .on(
            'postgres_changes',
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'chat', 
                filter: `equipid=eq.${equipAtualId}` 
            },
            (payload) => {
                setChatMessages((mensagensAtuais) => [...mensagensAtuais, payload.new]);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(canalChat);
    };
}, [equipAtualId]);

const whereClick = (i, item) => {
    const { pageX, pageY } = i.nativeEvent;

    resetInfos();
    setGerenciar(false);

    setPositionClick({ 'x': pageX, 'y': pageY });
    setUserReference(item.id);
    setImage(item.image);
    setMember(item.user);
    setCargo(item.cargo);
    
    setAdmin(item.cargo, item.id);

    setProfile(true);
};

const setAdmin = (cargoAlvo, idAlvo) => {
    if (idAlvo === userId) return;

    const choiced = cargos.indexOf(cargoAlvo);
    const possible = cargos.indexOf(meuCargo);

    if (possible <= choiced) return;

    if (meuCargo === 'administrador' || meuCargo === 'co-administrador') {
        setExpulsar(true);
    }

    let possiblePromos = { promotion: false, relegation: false };

    if (choiced > 0) {
        possiblePromos.relegation = true;
        setCargoInferior(cargos[choiced - 1]);
    }

    if (choiced < possible - 1 && cargoAlvo !== 'co-administrador') {
        possiblePromos.promotion = true;
        setCargoSuperior(cargos[choiced + 1]);
    }

    setPromotions(possiblePromos);
};

const resetInfos = () => {
    setUserConfig(false)
    setPromotions({promotion: false, relegation: false})
    setExpulsar(false)
    setCargoSuperior(null)
    setCargoInferior(null)
}

const editUser = async(newCargo) => { 
    if (userReference) {
        try {
            const {error} = await supabase
            .from('userequips')
            .update({cargo: newCargo})
            .select('cargo')
            .eq('userid', userReference)
            .eq('equipid', equipAtualId)

            if(!error) {
                const tipo = newCargo === cargoInferior ? 'rebaixado':'promovido'
                sendAlerta(userReference, tipo, newCargo, equipeName)
                resetInfos()
            }
            setCargo(newCargo)
            setAdmin(newCargo, userReference)
            console.log("Tentando atualizar:", {
    novoCargo: newCargo,
    idAlvo: userReference,
    idEquipe: equipAtualId
});
        } catch (error) {
            Alert.alert('Errado')
        }
    }
}

const expulse = async() => {
    try {
        const {} = await supabase
        .from('userequips')
        .delete()
        .eq('userid', userReference)
        .eq('equipid', equipAtualId)

        resetInfos()
        equipPage(equipAtualId)
        myEquips()
        sendAlerta(userReference, 'expulsao',null,  equipeName )
    } catch(e) {Alert.alert('erro')}
}

useEffect(() => {
    if(equipAtualId) {
        const stay = myEquip.some(item => item.id === equipAtualId)
        if (!stay) router.replace('/home')
    }
}, [myEquip, equipAtualId])

return (
    <View style = {{flex: 1, paddingHorizontal: 25}}>
        <ProfileModal 
                visible={profile}
                onClose={() => setProfile(false)}
                image={image}
                member={member}
                userId={userId}
                userReference={userReference}
                cargo={cargo}
                promotions={promotions}
                expulsar={expulsar}
                editUser={editUser}
                expulse={expulse}
                cargoSuperior={cargoSuperior}
                cargoInferior={cargoInferior}
        />
        <Modal
        visible={opnePendent} 
        transparent={true}
        statusBarTranslucent={true}
        animationType='fade'>
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20}}>
            <View style={{backgroundColor: 'white', padding: 20, borderRadius: 10}}>
                <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 15}}>Solicitações Pendentes</Text>
                
                {solicitacoesEquipe.map(item => (
                    <View key={item.userid} style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center'}}>
                        <Text style={{fontSize: 16}}>{item.username}</Text>
                        
                        <View style={{flexDirection: 'row', gap: 10}}>

                            <TouchableOpacity 
                                style={{backgroundColor: 'lightblue', padding: 8, borderRadius: 5}}
                                onPress={() => acceptSolicitation(item.notifid ,item.userid, equipAtualId, true)}>
                                <Text style={{color: 'black'}}>Aceitar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={{backgroundColor: 'red', padding: 8, borderRadius: 5}}
                                onPress={() => acceptSolicitation(item.notifid , item.userid, equipAtualId, false)}>
                                <Text style={{color: 'white'}}>Recusar</Text>
                            </TouchableOpacity>

                        </View>
                    </View>
                ))}

                <TouchableOpacity 
                    style={{marginTop: 20, alignSelf: 'center'}}
                    onPress={() => setOpenPendent(false)}>
                    <Text style={{color: 'black', borderWidth: 2, borderRadius: 10, padding: 8}}>Fechar</Text>
                </TouchableOpacity>

            </View>
        </View>
    </Modal>

    <Modal
        visible={openMembers}
        transparent={true}
        animationType="fade" 
        statusBarTranslucent={true}
        onRequestClose={() => setOpenMembers(false)}
        >
        
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', flexDirection: 'row' }}>
            
            <TouchableOpacity 
            style={{ flex: 0.4 }} 
            activeOpacity={1}
            onPress={() => setOpenMembers(false)}
            />

            <View style={{ flex: 0.85, backgroundColor: 'black', height: '100%' }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: 50 }}>
                {users.map(item => {
                const cargos = ['visitante', 'membro', 'operador', 'co-administrador', 'administrador']
                return (
                <View key={item.id}>
                    <View style = {{width: 220, height: 100, backgroundColor: '(rgb(13, 18, 61))', alignSelf: 'center', borderRadius: 20}}>
                        <TouchableOpacity style = {styles.botUsuarios} onPress={(i) => whereClick(i, item)}>
                            <View style = {{flexDirection: 'row'}}>
                                <Image source={{ uri: item.image }} style={styles.imagePeople} />
                                <Text style = {styles.usuarios}>{item.user}</Text>
                            </View>
                            <Text style ={styles.cargos}>{item.cargo}</Text>
                        </TouchableOpacity>
                    </View>
                </View> )})}
            </ScrollView>
            </View>

        </View>
    </Modal>
    <View style = {styles.topView}>

        <TouchableOpacity style = {styles.quitBt} onPress={() => router.replace('/home')}>
            <Text>Sair</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress = {() => router.push('/team/configs/teamConfig')}>
            <FontAwesome name='gear' color={'rgb(0,0,0)'} size={30}/>
        </TouchableOpacity>

    </View>

    <View style = {styles.container}>
        {(solicitacoesEquipe.length > 0 && (meuCargo === 'administrador' || meuCargo === 'co-administrador')
        ) ? (
            <TouchableOpacity style = {{padding: 10, backgroundColor: 'lightgreen', borderRadius: 12, marginBottom: 20}} onPress={() => setOpenPendent(true)}>
                <Text>{solicitacoesEquipe.length} solicitações pendentes</Text>
            </TouchableOpacity>
        ) : null
        }
    </View>
    <View style = {{marginRight: 8, alignItems: 'flex-end', justifyContent: 'flex-start'}}>
        <TouchableOpacity onPress={() => setOpenMembers(!openMembers)}>
            <Text><FontAwesome name='chevron-circle-left' size={30} color={'black'}/></Text>
        </TouchableOpacity>
    </View>

    <ScrollView 
        style={{ flex: 1, width: '100%', marginBottom: 10, paddingHorizontal: 10, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 10 }}
        contentContainerStyle={{ paddingVertical: 10 }}
    >
        {chatMessages.map((msg) => {
            const isMinhaMensagem = msg.userid === userId;
            const autorDaMensagem = users.find(u => u.id === msg.userid)?.user || "Membro";

            return (
                <View 
                    key={msg.id} 
                    style={{
                        alignSelf: isMinhaMensagem ? 'flex-end' : 'flex-start',
                        backgroundColor: isMinhaMensagem ? '#1aac93' : '#040527',
                        paddingHorizontal: 15,
                        paddingVertical: 10,
                        borderRadius: 15,
                        borderTopRightRadius: 0,
                        marginBottom: 10,
                        maxWidth: '80%'
                    }}>
                    {!isMinhaMensagem && (
                        <Text style={{ color: 'lightgray', fontSize: 10, marginBottom: 2, fontWeight: 'bold' }}>
                            {autorDaMensagem}
                        </Text>
                    )}
                    <Text style={{ color: 'white', fontSize: 15 }}>
                        {msg.message}
                    </Text>
                </View> 
            );
        })}
    </ScrollView>
    <View style = {{justifyContent: 'flex-start', alignItems: 'flex-end', flexDirection: 'row', marginBottom: 50}}>
            <TextInput
            maxLength={80}
            value = {messageText}
            onChangeText={setMessageText}
            style = {{borderRadius: 16, borderWidth: 1, BorderColor: 'black', paddingLeft: 10, paddingVertical: 5, width: '90%', paddingVertical:10}}
            returnKeyType='send'
            onSubmitEditing={async() =>{
                if (messageText.trim() !== '') {
                    await sendMessage(equipAtualId, userId, messageText)
                    setMessageText('')
                }
            }}
            />
            <TouchableOpacity style = {{marginBottom: 7, marginLeft: 8, backgroundColor: 'rgb(252, 158, 255)', borderRadius: 30, width: 30, height: 30}} onPress={() => {sendMessage(equipAtualId, userId, messageText), setMessageText('')}}>
                <Text><FontAwesome name="send" size={30} color="black"/></Text>
            </TouchableOpacity>
        </View>
    </View>
    )
}
const styles = StyleSheet.create({
    detalhesAba: {
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 5,
    marginLeft: 10
  },
  detalhesTexto: {
    color: 'gray',
    fontSize: 12,
    fontWeight: 'bold'
  },
  imagePeople: {height: 40, width: 40, borderRadius: 40, marginRight: 12},
    container: {justifyContent: 'center', alignItems: 'flex-start'},
    botUsuarios: {paddingHorizontal: 14, paddingVertical: 5, alignSelf: 'flex-start'},
    modalUse: {alignSelf: 'flex-start', paddingHorizontal: 6,paddingVertical: 8, borderRadius: 22, backgroundColor: 'white',position: 'absolute', elevation: 10},
    usuarios: {fontSize: 22, color: 'white'},
    quitBt: {backgroundColor: 'red', fontWeight: 'bold', marginBottom: 20, padding: 12, borderRadius: 12, marginTop: 15},
    topView: {alignItems: 'flex-end', justifyContent: 'flex-start', flexDirection: 'row-reverse'},
    optionBt: {fontWeight: 'bold', marginBottom: 20, padding: 12, borderRadius: 12, marginTop: 15, marginRight: 30},
    promote: {borderRadius: 15, paddingVertical: 5, paddingHorizontal: 12, marginTop: 4},
    cargos: {fontSize: 13, color: 'white', fontWeight: 'bold'}
})
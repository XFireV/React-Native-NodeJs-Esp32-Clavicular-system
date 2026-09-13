import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal } from 'react-native';
import { useContext } from 'react'; 
import { appContext } from '../../../../context/appContext';
import { Redirect, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../../supaBase/supa';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export const programatedMessages = {
    expulsao: (item) => `Você foi expulso da equipe ${item.equipeParametro} por ${item.by}`,
    promovido: (item) => `Você foi promovido a ${item.promotionParametro} na equipe ${item.equipeParametro}`,
    rebaixado: (item) => `Você foi rebaixado a ${item.promotionParametro} na equipe ${item.equipeParametro}`
}

const hierarchy = {
  'visitante': 1,
  'membro': 2,
  'operador': 3,
  'co-administrador': 4,
  'administrador': 5
};

const hasPermission = (cargoDoUser, requiredLevel) => {
  const userLevel = hierarchy[cargoDoUser] || 0;
  let minimumLevelRequired;
  
  switch(requiredLevel) {
    case 1: minimumLevelRequired = 5; break; 
    case 2: minimumLevelRequired = 1; break; 
    case 3: minimumLevelRequired = 1; break; 
    case 4: minimumLevelRequired = 2; break; 
    case 5: minimumLevelRequired = 3; break; 
    default: minimumLevelRequired = 5; 
  }

  return userLevel >= minimumLevelRequired;
};

const BotCreate = ({ title, press, minititle }) => (
    <TouchableOpacity style={styles.btCreate} onPress={press} activeOpacity={0.7}>
        <Text style={styles.txCreate}>{title}</Text>
        {minititle && <Text style={styles.miniCreate}>{minititle}</Text>}
    </TouchableOpacity>
)

export default function Home() {
    const [ipRascunho, setIpRascunho] = useState('');
    const { 
        addHistory, logged, espIp, setEspIp, usuarioL, localIp, notif, pessoalIp, throwEquip, 
        myEquip, setAlertas, setPessoalIp, senhaA, myEquips, userId, setExp, exp, cancelFriendship, setFriends,
        carregarPedidos, pedidosRecebidos, pedidosEnviados, friends, acceptFriend,
        sendInviteEquip, carregarSolicitacoesEntrada, gerenciarSolicitacaoEquipe, solicitacoesEquipe, ldr, opacityActive, setOpacityActive,
        equipConfig
    } = useContext(appContext);
    
    const [create, setCreate] = useState(false);
    const [listaIps, setListaIps] = useState([]);
    const [newIp, setNewIp] = useState(false);
    const [treasure, setTreasure] = useState(true);
    const [notifModal, setNotifModal] = useState(false);
    const [equipEsp, setEquipEsp] = useState('');
    const [openEquip, setOpenEquip] = useState('');
    const [openIp, setOpenIp] = useState('');
    const [atualEquipeIp, setAtualEquipeIp] = useState('');

    const cargoAtual = myEquip && myEquip.length > 0 ? myEquip[0].cargo : null;
    const regraAtivacao = equipConfig?.ativation || 1; 
    
    const isEquipIp = myEquip && myEquip.length > 0 && espIp === `http://${myEquip[0].ip}`;
    
    const canActivate = isEquipIp ? hasPermission(cargoAtual, regraAtivacao) : true;

    useEffect(() => {
        setNewIp(!pessoalIp);
        const novosIps = [];

        myEquip.forEach(item => {
            if (item.ip && item.ip !== null) { 
                novosIps.push({
                    equipe: item.equipe,
                    valor: `http://${item.ip}`,
                    id: item.id
                });
            }
        });

        if (pessoalIp) {
            novosIps.push({ 
                equipe: 'Uso Pessoal', 
                valor: `http://${pessoalIp}` 
            });
        }
        setListaIps(novosIps);

        if (novosIps.length > 0) {
            setCreate(true);
            const ipAindaExiste = novosIps.some(ip => ip.valor === espIp);
            if (!espIp || espIp === '' || !ipAindaExiste) {
                setEspIp(novosIps[0].valor);
                setAtualEquipeIp(novosIps[0].equipe); 
            }
        } else {
            setCreate(false);
            setEspIp(''); 
        }
    }, [myEquip, pessoalIp, senhaA]); 

    const ligarLED = async () => {
        const cancelFetch = new AbortController()
        const timeout = setTimeout(() => cancelFetch.abort(), 1200)
        setOpacityActive(true)

        try {
            const ligar = await fetch(`${espIp}/led`, {signal: cancelFetch.signal});
            if(!ligar.ok) throw new Error('Erro na requisição')
            addHistory('LED Ligado', equipEsp);
            setOpacityActive(false)
        } catch (error) {
            if (error.name === 'AbortError') {
                Alert.alert('A requisição demorou muito e foi cancelada (Timeout).');
            } else {
                Alert.alert(error.message);
            }
            const {error: supError} = await supabase
                .from('IPs')
                .select('confirm')
                .eq('ip', espIp.replace('http://', ''))
                .update({confirm: true})
        } finally {
            clearTimeout(timeout);
        }
    }

    const setNotifications = () => {
        setNotifModal(true);
        setAlertas();
        carregarPedidos();
    }

    const receiveExp = () => {
        const newExp = exp + 20;
        setExp(newExp);
        setTreasure(false);
    }

    const desligarLED = async () => {
        try {
            await fetch(`${espIp}/off`);
            addHistory('LED Desligado', equipEsp);
        } catch (error) {
            Alert.alert("Erro", "Não desligou");
        }
    }

    if (!logged) {
        return <Redirect href="/login" />;
    }

    return (
        <View style={styles.container}>
            <Modal
                statusBarTranslucent={true}
                animationType='slide'
                visible={notifModal}
                transparent={true}>
                
                <View style={styles.modalHeader}>
                    <TouchableOpacity style={styles.backButton} onPress={() => setNotifModal(false)}>
                        <FontAwesome name='arrow-left' color={'white'} size={24} />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Notificações</Text>
                </View>

                <View style={styles.telanotifModal}>
                    <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>

                        {notif.filter(item => item.content === 'entrada' || item.content === 'convite').length > 0 && (
                            <View style={styles.notificationSection}>
                                <Text style={styles.sectionTitle}>Ações de Equipe</Text>
                                
                                {notif.filter(item => item.content === 'entrada' || item.content === 'convite').map((item, i) => (
                                    <View key={`equipe-${item.id}`} style={styles.notificationCard}>
                                        <Text style={styles.notificationText}>
                                            {item.content === 'entrada' 
                                                ? `${item.by} quer entrar em ${item.equipeParametro}`
                                                : `${item.by} te convidou para ${item.equipeParametro}`}
                                        </Text>
                                        
                                        <View style={styles.actionButtonsRow}>
                                            <TouchableOpacity 
                                                style={styles.btnReject}
                                                onPress={() => gerenciarSolicitacaoEquipe(item.id, null, item.equipid, false)}>
                                                <Text style={styles.btnRejectText}>Recusar</Text>
                                            </TouchableOpacity>
                                            
                                            <TouchableOpacity 
                                                style={styles.btnAccept}
                                                onPress={() => {
                                                    const alvo = item.content === 'entrada' ? item.promotionParametro : userId;
                                                    gerenciarSolicitacaoEquipe(item.id, alvo, item.equipid, true);
                                                }}>
                                                <Text style={styles.btnAcceptText}>Aceitar</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {pedidosRecebidos && pedidosRecebidos.length > 0 && (
                            <View style={styles.notificationSection}>
                                <Text style={[styles.sectionTitle, { color: '#018cdd' }]}>Pedidos de Amizade</Text>
                                
                                {pedidosRecebidos.map((amigoId, i) => (
                                    <View key={`pedido-${i}`} style={styles.notificationCard}>
                                        <Text style={styles.notificationText}>{amigoId}</Text>
                                        <View style={styles.actionButtonsRow}>
                                            <TouchableOpacity 
                                                style={styles.btnReject}
                                                onPress={() => cancelFriendship(amigoId)}>
                                                <Text style={styles.btnRejectText}>Recusar</Text>
                                            </TouchableOpacity>
                                            
                                            <TouchableOpacity 
                                                style={styles.btnAccept}
                                                onPress={() => acceptFriend(amigoId)}>
                                                <Text style={styles.btnAcceptText}>Aceitar</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
                            <Text style={[styles.sectionTitle, { color: '#888' }]}>Histórico</Text>
                            
                            {notif.filter(item => !['amizade', 'entrada', 'convite'].includes(item.content)).length > 0 ? (
                                notif.filter(item => !['amizade', 'entrada', 'convite'].includes(item.content)).map((item, index) => {
                                    const type = item.content;
                                    const itens = { equipeParametro: item.equipeParametro, by: item.by, promotionParametro: item.promotionParametro };
                                    const content = programatedMessages[type] ? programatedMessages[type](itens) : "Notificação recebida";
                                    
                                    const dataObj = new Date(item.data);
                                    const horaDoItem = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                                    return (
                                        <View key={item.id} style={styles.historyItem}>
                                            <Text style={styles.historyTime}>{horaDoItem}</Text>
                                            <Text style={styles.historyText}>{content}</Text>
                                        </View>
                                    );
                                })
                            ) : (
                                <Text style={styles.emptyHistoryText}>Nenhuma outra notificação.</Text>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </Modal>
                            
            {!espIp || !espIp.includes('http://') ? (
                <View style={styles.setupContainer}> 
                    <View style={styles.setupContent}>
                        <Text style={styles.title}>Como você quer usar o claviculário?</Text>
                        
                        <BotCreate title='Uso pessoal' minititle='Insira um ID próprio e utilize-o individualmente' press={() => setNewIp(true)} />
                        <BotCreate title='Criar equipe' minititle='Crie uma equipe com um IP próprio compartilhável entre os membros em um sistema hierárquico' press={() => router.push('/creatingEquip')} />
                        <BotCreate title='Entrar em uma equipe' minititle='Entre em uma equipe que já possuí um IP compartilhado' press={() => router.push('/social')} />
                    </View>
                </View>
            ) : (
                <View style={{ flex: 1, width: '100%' }}>
                    <ScrollView contentContainerStyle={styles.controlBox} showsVerticalScrollIndicator={false}>
                        
                        <View style={styles.topSpacer} />

                        <TouchableOpacity style={[styles.btTreasure, { opacity: treasure ? 1 : 0.6 }]} onPress={() => receiveExp()} activeOpacity={0.8}>
                            <LinearGradient
                                colors={['#00c4f5', '#0059fd', '#8A2BE2', '#fd00be']}
                                style={styles.treasure}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}>
                                <Text style={styles.treasureText}>Receber XP</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                            <TouchableOpacity onPress={() => setOpenEquip(!openEquip)} style = {styles.dropdown}>
                                <Text style = {styles.dropdownSelectedText}>{atualEquipeIp}</Text>
                                {openEquip ? <Text><FontAwesome name='chevron-up' /></Text> : <Text><FontAwesome name='chevron-down'/></Text>}
                            </TouchableOpacity>

                        {openEquip && (
                            <View style={styles.customDropdownListContainer}>
                                {listaIps.map((item, index) => {
                                    const isSelected = espIp === item.valor;
                                    const isIpExpanded = openIp === item.equipe;

                                    return (
                                        <View key={item.id || index} style={{ backgroundColor: 'rgb(255, 251, 251)', paddingHorizontal: 10, marginBottom: 3 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <TouchableOpacity 
                                                    style={{ paddingVertical: 10, flex: 1 }}
                                                    onPress={() => {
                                                        setEspIp(item.valor); 
                                                        setEquipEsp(item.id);
                                                        setAtualEquipeIp(item.equipe);
                                                        setOpenEquip(false)
                                                    }}>
                                                    <Text style={[
                                                        { fontSize: 24, fontWeight: 'bold', color: '#000000' },
                                                        isSelected && { color: '#0ea5e9' } 
                                                    ]}>
                                                        {item.equipe}
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity 
                                                    style={{ padding: 10 }}
                                                    onPress={() => {
                                                        setOpenIp(isIpExpanded ? null : item.equipe);
                                                    }}>
                                                    <FontAwesome 
                                                        name={isIpExpanded ? 'chevron-right' : 'chevron-left'} 
                                                        size={26} 
                                                        color={isIpExpanded ? '#0ea5e9' : '#000000'}
                                                    />
                                                </TouchableOpacity>
                                            </View>

                                            {isIpExpanded && (
                                                <View style={{ paddingBottom: 10, paddingHorizontal: 5 }}>
                                                    <Text style={{ color: '#64748b', fontSize: 16, fontStyle: 'italic' }}>
                                                        Endereço: {item.valor}
                                                    </Text>
                                                </View>
                                            )}

                                        </View>
                                    );
                                })}
                            </View>
                        )}
                        {newIp ? (
                            <View style={styles.inputBox}>
                                <TextInput
                                    style={styles.ipText}
                                    placeholder='Digite o IP do Esp32'
                                    placeholderTextColor="#9ca3af"
                                    keyboardType='numeric'
                                    value={ipRascunho}
                                    onChangeText={setIpRascunho}
                                />
                                <TouchableOpacity style={styles.ipBot} onPress={() => localIp(ipRascunho)} activeOpacity={0.8}>
                                    <Text style={styles.ipBotText}>Confirmar</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}

                        <View style={styles.ledButtonsContainer}> 
                            <TouchableOpacity 
                                style={[styles.botaoLD, { backgroundColor: canActivate ? '#10b981' : '#64748b' }]} 
                                onPress={ligarLED} 
                                disabled={opacityActive || !canActivate} 
                                activeOpacity={(opacityActive || !canActivate) ? 0.4 : 1}
                            >
                                <FontAwesome name={canActivate ? "power-off" : "lock"} size={24} color="#fff" style={{ marginBottom: 8 }} />
                                <Text style={styles.btLedText}>Ligar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.botaoLD, { backgroundColor: canActivate ? '#ef4444' : '#64748b' }]} 
                                onPress={desligarLED} 
                                disabled={opacityActive || !canActivate} 
                                activeOpacity={(opacityActive || !canActivate) ? 0.4 : 1}
                            >
                                <FontAwesome name={canActivate ? "power-off" : "lock"} size={24} color="#fff" style={{ marginBottom: 8 }} />
                                <Text style={styles.btLedText}>Desligar</Text>
                            </TouchableOpacity>
                        </View>

                        {!canActivate && (
                            <Text style={{color: '#ef4444', textAlign: 'center', marginTop: -25, marginBottom: 30, fontSize: 13, fontWeight: '600'}}>
                                <FontAwesome name="warning" /> Seu cargo ({cargoAtual}) não permite ativação remota.
                            </Text>
                        )}

                        <View style = {{flex: 1, flexDirection: 'row'}}>
                        {Object.keys(ldr).map((item) => (
                            <View key={item} style = {{height:20, width: 20, borderRadius: 10, backgroundColor: ldr[item] ? 'green' : 'red', marginRight: 6}}>
                            </View>))}
                        </View>

                        <Text style={styles.teamsSectionTitle}>Minhas Equipes</Text>
                        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lisTeams}>
                            {myEquip.map(item => (
                                <TouchableOpacity key={item.id} style={styles.myEquips} onPress={() => throwEquip(item.id)} activeOpacity={0.8}>
                                    <Text style={styles.equiptx} numberOfLines={2}>{item.equipe}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                    </ScrollView>
                </View>
            )}

            <TouchableOpacity style={styles.notifModalications} onPress={() => setNotifications()} activeOpacity={0.8}>
                <FontAwesome name='bell' size={22} color='#1e293b' />
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f8fafc' 
    },
    
    setupContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    setupContent: { 
        width: '90%', 
        alignItems: 'center', 
        paddingVertical: 40 
    },
    title: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: '#0f172a', 
        marginBottom: 30, 
        textAlign: 'center',
        lineHeight: 32
    },
    btCreate: {
        padding: 20, 
        marginBottom: 16, 
        backgroundColor: '#ffffff', 
        width: '100%',  
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    txCreate: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#1e293b', 
        marginBottom: 6 
    },
    miniCreate: { 
        fontSize: 14, 
        color: '#64748b', 
        lineHeight: 20 
    },

    controlBox: { 
        flexGrow: 1, 
        flexDirection: 'column', 
        paddingHorizontal: 24,
        paddingBottom: 40
    },
    topSpacer: { 
        height: 100 
    },
    
    btTreasure: { 
        alignSelf: 'flex-start', 
        marginBottom: 24,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    treasure: { 
        borderRadius: 16, 
        paddingHorizontal: 28, 
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center'
    },
    treasureText: { 
        color: 'white', 
        fontWeight: 'bold', 
        fontSize: 16,
        letterSpacing: 0.5
    },

    dropdown: {
        width: '100%', 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 55,
        backgroundColor: '#ffffff',
        borderRadius: 15,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
    },

    dropdownSelectedText: { 
        color: '#0f172a', 
        fontSize: 16, 
        fontWeight: 'bold', 
        textAlign: 'left'
    },

    inputBox: { 
        flexDirection: 'row', 
        alignItems: 'center',
        marginBottom: 32, 
        width: '100%'
    },
    ipText: { 
        flex: 1,
        height: 56,
        backgroundColor: '#ffffff',
        borderWidth: 1, 
        borderColor: '#e2e8f0', 
        borderRadius: 12, 
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#0f172a',
        marginRight: 12
    },
    ipBot: { 
        backgroundColor: '#0ea5e9', 
        height: 56,
        paddingHorizontal: 20, 
        borderRadius: 12,
        justifyContent: 'center',
        elevation: 2,
    },
    ipBotText: { 
        color: '#ffffff', 
        fontWeight: 'bold', 
        fontSize: 16 
    },

    ledButtonsContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        width: '100%',
        marginBottom: 40 
    },
    botaoLD: { 
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24, 
        borderRadius: 20, 
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        marginHorizontal: 6
    },
    btLedText: { 
        fontSize: 18, 
        fontWeight: 'bold',
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: 1
    },

    teamsSectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
        marginLeft: 4
    },
    lisTeams: {
        paddingBottom: 20,
        paddingLeft: 4,
        paddingRight: 20
    },
    myEquips: {
        backgroundColor: '#a855f7',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        height: 120,
        width: 140,
        elevation: 6,
        marginRight: 16, 
        borderBottomWidth: 6,
        borderBottomColor: '#9333ea',
        shadowColor: '#a855f7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        padding: 16
    },
    equiptx: {
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#ffffff',
        textAlign: 'center',
    },

    notifModalications: {
        backgroundColor: '#ffffff',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 50,
        right: 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },

    modalHeader: { 
        flexDirection: 'row', 
        backgroundColor: '#0f172a', 
        alignItems: 'center', 
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20
    },
    backButton: { 
        marginRight: 20,
        padding: 8
    },
    modalTitle: { 
        color: '#ffffff', 
        fontSize: 24, 
        fontWeight: 'bold' 
    },
    telanotifModal: { 
        backgroundColor: '#0f172a', 
        flex: 1, 
        width: '100%' 
    },
    notificationSection: { 
        marginBottom: 16, 
        paddingHorizontal: 20, 
        marginTop: 20, 
        borderBottomWidth: 1, 
        borderBottomColor: '#334155', 
        paddingBottom: 20 
    },
    sectionTitle: { 
        color: '#10b981', 
        fontWeight: 'bold', 
        marginBottom: 16, 
        fontSize: 14, 
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    notificationCard: { 
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'column'
    },
    notificationText: { 
        fontSize: 16, 
        color: '#f8fafc', 
        marginBottom: 12,
        lineHeight: 22
    },
    actionButtonsRow: { 
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    btnReject: { 
        backgroundColor: '#334155', 
        paddingHorizontal: 16, 
        paddingVertical: 10, 
        borderRadius: 8, 
        marginRight: 12 
    },
    btnRejectText: { 
        color: '#f8fafc', 
        fontWeight: 'bold' 
    },
    btnAccept: { 
        backgroundColor: '#0ea5e9', 
        paddingHorizontal: 20, 
        paddingVertical: 10, 
        borderRadius: 8 
    },
    btnAcceptText: { 
        color: '#ffffff', 
        fontWeight: 'bold' 
    },
    historyItem: { 
        marginVertical: 12, 
        borderBottomWidth: 1, 
        borderBottomColor: '#334155', 
        paddingBottom: 12 
    },
    historyTime: { 
        color: '#94a3b8', 
        fontSize: 12,
        marginBottom: 4
    },
    historyText: { 
        color: '#e2e8f0', 
        fontSize: 15,
        lineHeight: 22
    },
    emptyHistoryText: { 
        color: '#64748b', 
        marginTop: 16, 
        fontStyle: 'italic',
        textAlign: 'center'
    }
});
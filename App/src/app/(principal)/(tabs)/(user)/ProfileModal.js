import React, { useState, createContext, useContext, useEffect } from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { appContext } from '../../../../context/appContext'
import { send } from '@emailjs/browser';

export default function ProfileModal({ 
  visible, 
  onClose, 
  image, 
  member, 
  userId, 
  userReference,
  // Props Opcionais de Equipe:
  cargo, 
  promotions, 
  expulsar, 
  editUser, 
  expulse,
  cargoSuperior,
  cargoInferior
}) {
  const [gerenciar, setGerenciar] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [selecionandoEquipe, setSelecionandoEquipe] = useState(false)
  const [equipeSelecionada, setEquipeSelecionada] = useState(null)
  const cargosInvite = {
    'visitante': 0,
    'membro' : 1,
    'operador' : 2,
    'co-administrador' : 3,
    'administrador' : 4
  }

  const {sendAlerta, setFriends, pedidosEnviados, awaitedFriendRequests, carregarPedidos, myEquip, userReferenceEquips, 
    equipesUserSelected, usuarioL, amigosIds, sendInviteEquip,carregarSolicitacoesEntrada, gerenciarSolicitacaoEquipe, 
    solicitacoesEquipe,} = useContext(appContext)

  const handleClose = () => {
    setGerenciar(false);
    onClose();
  };
  useEffect(() => {
    if (visible) {
      setEnviado(false);
      setGerenciar(false);
      equipesUserSelected(userReference)
      
      const atualizarDados = async () => {
        await carregarPedidos();
        if (awaitedFriendRequests) await awaitedFriendRequests();
      };
      
      atualizarDados();
    }
  }, [visible, userReference])
  console.log("Estado atual de userReference:", userReference)

  return (
    <View>
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={handleClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' }}>
          
          <TouchableOpacity style={{ flex: 1, width: '100%' }} onPress={handleClose} />

          <View style={styles.modalContent}>
            <Image  style = {{height: 110, width: 110, borderRadius: 65, marginTop: 30}}source={ image ? (typeof image === 'string' ? { uri: image } : image) : require('../../../../assets/profile.jpg')
            }/>
            
            <Text style={styles.name}>{member}</Text>
            
            {cargo && <Text style={styles.role}>{cargo}</Text>}

            {userReference !== userId && (
              <View style={{ flexDirection: 'row', marginTop: 20 }}>
                {(() => {
                  const jaAmigo = amigosIds && (amigosIds.includes(userReference) || amigosIds.includes(member));
                  
                  if (jaAmigo) {
                    return (
                      <View style={{
                        paddingHorizontal: 40, paddingVertical: 12, backgroundColor: 'rgba(76, 95, 95, 0.9)', 
                        borderRadius: 16, opacity: 0.8
                      }}>
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Vocês já são amigos</Text>
                      </View>
                    );
                  }

                  const pedidoExistente = pedidosEnviados.find(item => item.receiver === userReference);
                  
                  if (pedidoExistente && pedidoExistente.status === false) {
                    return (
                      <TouchableOpacity 
                        disabled={true}
                        style={{
                          paddingHorizontal: 40, paddingVertical: 12, backgroundColor: 'rgba(76, 95, 95, 0.9)', 
                          borderRadius: 16, opacity: 0.8
                        }}>
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Pedido pendente</Text>
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <TouchableOpacity 
                      disabled={enviado}
                      style={styles.addBtn} 
                      onPress={async () => {
                        setEnviado(true);
                        await sendAlerta(userReference, 'amizade', null, null);
                        await setFriends(userReference);
                        await carregarPedidos()
                      }}>
                      <Text style={{ color: 'white', fontWeight: 'bold' }}>
                        {enviado ? 'Enviando...' : 'Adicionar Amigo'}
                      </Text>
                    </TouchableOpacity>
                  );
                })()}
              </View>
            )}

            <View style={styles.manageBox}>
            
            {(() => {
              if (userReferenceEquips === null) {
                return <Text style={{ color: 'gray', padding: 15 }}>Carregando...</Text>;
              }
              const idsEquipesDoAlvo = userReferenceEquips.map(eq => String(eq.id))
              const equipesElegiveis = myEquip.filter(minhaEquipe => {
                  const temPermissao = cargosInvite[minhaEquipe.cargo] >= minhaEquipe.invite
                  const alvoNaoEsta = !idsEquipesDoAlvo.includes(String(minhaEquipe.id))
                  
                  return temPermissao && alvoNaoEsta;
              })

              if (equipesElegiveis.length === 0) return null;

              return selecionandoEquipe ? (
                <View style={{ padding: 10 }}>
                  <Text style={{ color: 'white', marginBottom: 10, fontWeight: 'bold' }}>Selecione a equipe:</Text>
                  
                  {equipesElegiveis.map(item => {
                    const isSelected = equipeSelecionada === item.id;
                    return (
                      <TouchableOpacity 
                        key={item.id} 
                        onPress={() => {if (equipeSelecionada === item.id){setEquipeSelecionada('')} else setEquipeSelecionada(item.id)}}
                        style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          paddingVertical: 8,
                          backgroundColor: isSelected ? 'rgba(67, 185, 253, 0.2)' : 'transparent',
                          borderRadius: 8,
                          marginBottom: 5
                        }}>
                        <FontAwesome 
                          name={isSelected ? "dot-circle-o" : "circle-o"} 
                          size={18} 
                          color={isSelected ? "#43b9fd" : "white"} 
                          style={{ marginLeft: 10 }}
                        />
                        <Text style={{ color: 'white', marginLeft: 10 }}>{item.equipe}</Text>
                      </TouchableOpacity>
                    );
                  })}

                  {equipeSelecionada && (
                    <TouchableOpacity 
                      style={{ backgroundColor: '#1bb3b3', padding: 10, borderRadius: 10, marginTop: 10 }}
                      onPress={async () => {
                        const eq = equipesElegiveis.find(e => e.id === equipeSelecionada);
                        
                        const sucesso = await sendInviteEquip({
                          idAlvo: userReference,
                          tipo: 'convite',         
                          equipeNome: eq.equipe, 
                          idEquipe: eq.id     
                        });

                        if (sucesso) {
                          alert("Convite enviado!");
                          setSelecionandoEquipe(false);
                          setEquipeSelecionada(null);
                        }
                      }}>
                      <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Confirmar Convite</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity onPress={() => setSelecionandoEquipe(false)} style={{ marginTop: 10 }}>
                    <Text style={{ color: 'gray', textAlign: 'center' }}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.manageRow} 
                  onPress={() => setSelecionandoEquipe(true)}>
                  <FontAwesome name="user-plus" size={20} color="rgb(99, 255, 93)" />
                  <Text style={[styles.manageText, {color: 'rgb(99, 255, 93)'}]}>
                    Convidar para equipe
                  </Text>
                </TouchableOpacity>
              );
            })()}
          </View>
          
            {cargo && userReference !== userId && (
              <View style={styles.manageBox}>
                {(promotions?.promotion || promotions?.relegation) && (
                  <View>
                    <TouchableOpacity style={styles.manageRow} onPress={() => setGerenciar(!gerenciar)}>
                      <FontAwesome name="gear" size={22} color={gerenciar ? "#00ccaa" : "white"} />
                      <Text style={styles.manageText}>Gerenciar Cargo</Text>
                      <FontAwesome name={gerenciar ? "chevron-up" : "chevron-down"} size={14} color="gray" style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>

                    {gerenciar && (
                      <View style={{paddingLeft: 10 }}>
                        {promotions?.promotion && (
                          <TouchableOpacity style={{ paddingVertical: 12 }} onPress={() => editUser(cargoSuperior)}>
                            <Text style={{ color: '#09eec8', fontSize: 16, fontWeight: '600' }}>Promover a {cargoSuperior}</Text>
                          </TouchableOpacity>
                        )}
                        {promotions?.relegation && (
                          <TouchableOpacity style={{ paddingVertical: 12 }} onPress={() => editUser(cargoInferior)}>
                            <Text style={{ color: '#ff5f02', fontSize: 16, fontWeight: '600' }}>Rebaixar para {cargoInferior}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {expulsar && (
                  <TouchableOpacity style={styles.manageRow} onPress={() => expulse()}>
                    <FontAwesome name="ban" size={22} color="#ff4444" />
                    <Text style={{ color: '#ff4444', fontWeight: 'bold', fontSize: 20, marginLeft: 15 }}>Expulsar da Equipe</Text>
                  </TouchableOpacity>
                )}

                {(!promotions?.promotion && !promotions?.relegation && !expulsar) && (
                  <Text style={{ color: 'gray', fontStyle: 'italic', padding: 20 }}>Você não tem autoridade sobre este membro.</Text>
                )}
              </View>
            )}

          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  modalContent: { height: 725, width: '100%', borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: 'rgb(4, 5, 26)', paddingHorizontal: 30 },
  avatar: { height: 110, width: 110, borderRadius: 55, marginTop: 25, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  name: { color: 'white', fontSize: 30, marginTop: 15, fontWeight: 'bold' },
  role: { color: 'rgba(230, 230, 230, 0.8)', fontSize: 18 },
  addBtn: { paddingHorizontal: 50, paddingVertical: 12, backgroundColor: 'rgba(27, 179, 179, 0.9)', borderRadius: 16 },
  manageBox: { marginTop: 25, backgroundColor: 'rgba(13, 18, 102, 0.2)', borderRadius: 20, paddingVertical: 10 },
  manageRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20 },
  manageText: { color: 'white', fontWeight: 'bold', fontSize: 20, marginLeft: 15 },
});
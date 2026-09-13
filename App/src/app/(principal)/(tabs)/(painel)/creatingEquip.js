import React, { useState, useContext } from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native'
import { appContext } from '../../../../context/appContext'
import { Dropdown } from 'react-native-element-dropdown'
import { router } from 'expo-router'

export default function CreatingEquip() { 
    const { createEquip, equipName, setEquipName, espIp, setShareIp, shareIp, valorIp, setValorIp, 
        valorSever, setValorServer, valorInviteDados, setValorInviteDados, equipServer, inviteDados, checkEquipNetwork } = useContext(appContext)

    const [ipError, setIpError] = useState(null)
    const [nameError, setNameError] = useState(null)
    const [serverError, setServerError] = useState(null)
    const [inviteError, setInviteError] = useState(null)

    const criar = async() => {
        const { hasError, mac } = await checkEquipNetwork(equipName, shareIp, valorInviteDados, valorSever)
        
        if (hasError || !mac) {
            Alert.alert("Erro", "Não foi possível conectar ao ESP32 ou nome inválido.");
            return false;
        } else {
            await createEquip(mac) 
            router.replace('/social')
            return true;
        }
    }

    return (
        <View style={styles.formContainer}>
            <View style={styles.creatingarea}>
                <Text style={styles.label}>Nova Equipe</Text>

                <TextInput 
                    style={[styles.input, {borderColor: nameError ? 'red' : 'black'}]}
                    placeholder='Digite o nome da equipe'
                    value={equipName}
                    onChangeText={setEquipName}
                />

                <TextInput 
                    style={[styles.input, {borderColor: ipError ? 'red' : 'black'}]}
                    placeholder='IP do controlador'
                    value={shareIp}
                    onChangeText={setShareIp}
                    keyboardType='numeric'
                    
                />

                <Dropdown
                    style={[styles.dropdown, {borderColor: inviteError ? 'red':'black',}]}
                    data={inviteDados}
                    labelField="label"
                    valueField="value"
                    placeholder= 'selecione'
                    value={valorInviteDados}
                    onChange={item => setValorInviteDados(item.value)}
                />

                <Dropdown
                    style={[styles.dropdown, {borderColor: serverError ? 'red':'black'}]}
                    data={equipServer}
                    labelField="label"
                    valueField="value"
                    placeholder= 'selecione'
                    value={valorSever}
                    onChange={item => setValorServer(item.value)}
                />
                
                <TouchableOpacity style={styles.createB} onPress={criar}>
                    <Text style={styles.createtx}>Criar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.btnCancelar} 
                    onPress={() => router.replace('/social')}>
                    <Text style={{ color: 'black' }}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    formContainer: {
        backgroundColor: 'lightgray',
        flex: 1, 
        alignItems: 'center',
        justifyContent: 'center', 
        paddingHorizontal: 30, 
    },
    creatingarea: {
        backgroundColor: 'white', 
        height: 400, 
        width: 325, 
        borderRadius: 20, 
        justifyContent: 'center', 
        padding: 15, 
        alignItems: 'stretch'
    },
    label: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20
    },
    createB: {
        alignSelf: 'center', 
        marginTop: 25, 
        backgroundColor: 'black', 
        borderRadius: 15, 
        borderColor: 'white', 
        borderWidth: 1, 
        paddingVertical: 15, 
        paddingHorizontal: 30
    },
    createtx: {
        color: 'white', 
        fontSize: 15
    },
    input: {
        alignSelf: 'stretch',
        fontSize: 14,
        borderWidth: 1,  
        borderRadius: 8,
        marginBottom: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        textAlign: 'center'
    },
    dropdown: {
        fontSize: 14,
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 10,
        marginBottom: 10
    },
    btnCancelar: {
        marginTop: 15,
        alignSelf: 'center',
        borderColor: 'black',
        borderWidth: 1,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 10
    }
});
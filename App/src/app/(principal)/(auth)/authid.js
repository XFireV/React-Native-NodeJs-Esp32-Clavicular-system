    import React, { useState, useEffect } from 'react';
    import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
    import { useContext } from 'react'; 
    import { appContext } from '../../../context/appContext';
    import { router } from 'expo-router';

    export default function Authid() {
        const {id, saveCredentials, setFirstLog, signCredentials} = useContext(appContext)
        const [rascunhoId, setRascunhoId] = useState('')
        const sucesso = async() => {
            const {usuarioS, senhaS, emailS} = signCredentials
            if (rascunhoId.toUpperCase().trim() === id.toUpperCase()) {
                const rightCredentials = await saveCredentials(emailS, usuarioS, senhaS)
                 if (rightCredentials){
                    setFirstLog(true)
                    router.replace('/login')
                }
            } 
            else {Alert.alert('ID errado')}
        }
    
        return (
            <View style = {styles.input}>
                <TextInput
                style ={styles.caixaInput}
                placeholder='Digite o ID'
                value = {rascunhoId}
                onChangeText={setRascunhoId}/>
                <TouchableOpacity style ={styles.botaoConfirm} onPress={() => sucesso()}>
                    <Text>Confirmar</Text>
                </TouchableOpacity>
            </View>
        )
    }
        const styles = StyleSheet.create({
        input: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'white'
            },
        botaoConfirm: {
            padding: 15,
            marginTop: 12,
            backgroundColor: 'pink',
            borderRadius: 8,
            width: 50
        },
        caixaInput: {
            padding: 10,
            borderWidth: 1,
            fontSize: 18,
            borderRadius: 7,
            borderColor: 'black'
        }
        })
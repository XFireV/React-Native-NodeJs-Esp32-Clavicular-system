import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Button, StyleSheet, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { useContext } from 'react';
import { appContext } from '../../../../context/appContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../../supaBase/supa';

export default function Config() {
  const {setEspIp, redefinirPass, setSenhaA, activeLoginSave, senhaA, logout, loginSave, usuarioL} = useContext(appContext)
  const [senhaRascunho, setSenhaRascunho] = useState('')
  const [senhaTry, setSenhaTry] = useState('')

  const router = useRouter()

  const deleteInp = () => {setSenhaRascunho(''), setSenhaTry('')}

  const deleteMac = async() => {
    try {
      const {data, error} = await supabase
      .from('usuarios')
      .update({ mac: null }) 
      .select('mac')
      .eq('user', usuarioL)

      if(error) throw(error)

      setPessoalIp('') 
      router.replace('/home')
    }
    catch(error) {Alert.alert('Não foi possível apagar os dados')}
  }

  const alterarSenha = async() => {
    if (senhaTry == '' || senhaRascunho == '') {
      Alert.alert('Você precisa preencher os campos')
      deleteInp() 
      return
    }
    if (senhaTry.length < 6 || senhaRascunho.length < 6) { 
      Alert.alert("A senha precisa ter no mínimo 6 carácteres")
      deleteInp()
      return 
    }
    if (senhaTry === senhaRascunho) {
      const senhaAlterada = await redefinirPass(senhaTry)
      if (senhaAlterada) {
        deleteInp()
        return
      } else {Alert.alert('Não foi possível salvar a senha')
        return
      }
    }
  }

  return (
    <View style={styles.container}>
      {senhaA ? (
        <>
        <TextInput
        style = {styles.universalinp}
        value = {senhaRascunho}
        placeholder='Nova Senha'
        placeholderTextColor={'black'}
        onChangeText={setSenhaRascunho}/>
        <TextInput
        style = {styles.universalinp}
        value={senhaTry}
        placeholder='Confirmar senha'
        placeholderTextColor={'black'}
        onChangeText={setSenhaTry}/>
        <TouchableOpacity 
        style = {styles.universalbt}
        onPress={() => alterarSenha()}>
          <Text style = {styles.universaltext}>Aceitar</Text>
        </TouchableOpacity>
        </>
      ) : (
      <>
      <TouchableOpacity onPress={() => setSenhaA(true)} style = {styles.universalbt}>
          <Text style = {styles.universaltext}>Alterar Senha</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style = {styles.universalbt}
        onPress = {() => deleteMac()}>
        <Text style = {styles.universaltext}>Excluir IP salvo</Text>
      </TouchableOpacity> 
      <View style = {styles.containerS}>
        <Switch
        onValueChange={activeLoginSave}
        thumbColor={'skyblue'}
        trackColor={{false: 'white', true: 'black'}}
        value={loginSave}/>
        <Text style = {styles.switchtext}>Salvar Login</Text>
      </View>
      <TouchableOpacity onPress={logout} style = {styles.logout}>
          <Text styles = {styles.universaltext}>LogOut</Text>
      </TouchableOpacity>
      </>
      )}
    </View> 
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  containerS: {
    flexDirection: 'row'
  },

  universaltext: {
    fontSize: 15, 
    color: 'white'
  },
  switchtext: {
    fontSize: 15,
    fontWeight: 'bold',
    paddingTop: 12
  },
  universalbt: {padding: 10, borderRadius:8, backgroundColor: 'black', marginBottom: 5},
  logout: {padding: 10, borderRadius:8, backgroundColor: 'red', marginBottom: 5},
  universalinp: {borderRadius: 10, borderWidth: 1, fontSize: 15, marginBottom: 5}
});
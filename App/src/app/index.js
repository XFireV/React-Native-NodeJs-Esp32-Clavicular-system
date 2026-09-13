import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import { useContext } from 'react'; 
import { appContext } from '../context/appContext';
import { Link } from 'expo-router';

export default function Sign() {
  const {alreadyRegistred,
    userCheck, emailCheck, smallPass, signin
    ,signCredentials, setSignCredentials, clearEmail,
    credentialChange} = useContext(appContext)

    useEffect(() => {
      setSignCredentials({
        user: '',
        senha: '',
        email: ''
      })
    }, [])

  return (
    <View style={styles.container}>
      <View style={styles.form}>

        <TextInput 
          style={[styles.input, { borderColor: emailCheck ? 'grey' : 'red'}]}
          placeholder='Digite seu Email'
          placeholderTextColor='grey'
          value={signCredentials.emailS}
          onChangeText={valor => credentialChange('emailS', valor, 'signin' )}/>
          {!emailCheck ? (<Text style = {[styles.textError, {color: 'red'}]}>insira um email</Text>) : (null)}

        <TextInput 
          style={[styles.input, { borderColor: userCheck ? 'grey' : 'red' }]}
          placeholder='Digite seu Nome'
          placeholderTextColor='grey'
          value={signCredentials.usuarioS}
          onChangeText={valor => credentialChange('usuarioS', valor, 'signin' )}/>
          {!userCheck ? (<Text style = {[styles.textError, {color: 'red'}]}>o nome é muito curto </Text>) : (null)}
        
        <TextInput 
          style={[styles.input, { borderColor: smallPass ? 'red' : 'grey' }]}
          value={signCredentials.senhaS}
          placeholder='Digite a senha'
          placeholderTextColor='grey'
          onChangeText={valor => credentialChange('senhaS', valor, 'signin' )}/>
          {smallPass ? (<Text style = {[styles.textError, {color: 'red'}]}>a senha é muito curta</Text>) : (null)}

        <View style={styles.buttonContainer}>
          {alreadyRegistred ? (<Text style = {{color: 'red', textAlign: 'center'}}>Esse email já está em uso</Text>) : (null)}
          <TouchableOpacity style={styles.buttonConfirm} onPress={signin}>
            <Text style={styles.buttonText}>Confirmar</Text>
          </TouchableOpacity>
          <Text style = {{textAlign: 'center', fontSize: 15}}>Já tem uma conta? faça <Link href={'/login'} style = {[{fontSize: 16, color: '#32a3ff'}]}>Login</Link></Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff' 
  },
  form: {
    width: '80%',
    alignItems: 'center'
  },
  input: {
    fontSize: 15, 
    borderWidth: 1, 
    marginBottom: 12, 
    padding: 10,
    width: '100%',
    borderRadius: 5,
    textAlign: 'center'
  },
  buttonContainer: {
    width: '100%',
    gap: 10, 
    marginTop: 10
  },
  buttonConfirm: {
    backgroundColor: 'skyblue', 
    paddingVertical: 15, 
    borderRadius: 5, 
    alignItems: 'center'
  },
  buttonEmail: {
    backgroundColor: '#e1f5fe',
    paddingVertical: 15, 
    borderRadius: 5, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'skyblue'
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#333'
  },
  textError: {
    fontSize: 12,
    marginBottom: 12
  }
});
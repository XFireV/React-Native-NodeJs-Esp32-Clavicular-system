import React, { useEffect } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useContext } from 'react'; 
import { appContext } from '../context/appContext';
import { Link } from 'expo-router';

export default function Sign() {
  const {
    alreadyRegistred,
    userCheck, 
    emailCheck, 
    smallPass, 
    signin,
    signCredentials, 
    setSignCredentials, 
    credentialChange
  } = useContext(appContext);

  useEffect(() => {
    // Garante que os campos venham vazios ao abrir a tela
    setSignCredentials({
      usuarioS: '',
      senhaS: '',
      emailS: ''
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.form}>

        <TextInput 
          style={[styles.input, { borderColor: emailCheck ? 'grey' : 'red' }]}
          placeholder='Digite seu Email'
          placeholderTextColor='grey'
          autoCapitalize="none"
          keyboardType="email-address"
          value={signCredentials.emailS}
          onChangeText={valor => credentialChange('emailS', valor, 'signin')}
        />
        {!emailCheck ? (<Text style={[styles.textError, { color: 'red' }]}>Insira um e-mail válido</Text>) : null}

        <TextInput 
          style={[styles.input, { borderColor: userCheck ? 'grey' : 'red' }]}
          placeholder='Digite seu Nome de Usuário'
          placeholderTextColor='grey'
          autoCapitalize="none"
          value={signCredentials.usuarioS}
          onChangeText={valor => credentialChange('usuarioS', valor, 'signin')}
        />
        {!userCheck ? (<Text style={[styles.textError, { color: 'red' }]}>O nome é muito curto (min 3 chars)</Text>) : null}
        
        <TextInput 
          style={[styles.input, { borderColor: smallPass ? 'red' : 'grey' }]}
          value={signCredentials.senhaS}
          placeholder='Digite a senha'
          placeholderTextColor='grey'
          secureTextEntry={true} // Oculta a senha por padrão
          autoCapitalize="none"
          onChangeText={valor => credentialChange('senhaS', valor, 'signin')}
        />
        {smallPass ? (<Text style={[styles.textError, { color: 'red' }]}>A senha precisa ter no mínimo 6 caracteres</Text>) : null}

        <View style={styles.buttonContainer}>
          {alreadyRegistred ? (<Text style={{ color: 'red', textAlign: 'center' }}>Esse nome ou e-mail já está em uso</Text>) : null}
          
          <TouchableOpacity style={styles.buttonConfirm} onPress={signin}>
            <Text style={styles.buttonText}>Confirmar</Text>
          </TouchableOpacity>
          
          <Text style={{ textAlign: 'center', fontSize: 15, marginTop: 15 }}>
            Já tem uma conta? Faça <Link href={'/login'} style={{ fontSize: 16, color: '#32a3ff' }}>Login</Link>
          </Text>
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
    textAlign: 'center' // Alterado de left para center conforme o original
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
  buttonText: {
    fontWeight: 'bold',
    color: '#333'
  },
  textError: {
    fontSize: 12,
    marginBottom: 12
  }
});

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Pressable } from 'react-native';
import { useContext } from 'react'; 
import { appContext } from '../../../context/appContext';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function Login() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const { 
    loginErro, 
    loginCredentials, 
    login, 
    credentialChange 
  } = useContext(appContext);

  useEffect(() => {
    // Caso queira limpar os erros ao abrir a tela de login
  }, []);

  return (
    <View style={styles.contai}>
      <LinearGradient
        style={{ flex: 1 }}
        colors={['#0f184b', '#175186', '#1b529b', '#091a3f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}>
          <Text><FontAwesome name='arrow-left' color='white' size={25} /></Text>
        </TouchableOpacity>
        
        <Text style={{ alignSelf: 'center', color: 'white', fontWeight: 'bold', fontSize: 26 }}>
          Bem vindo de volta
        </Text>
        
        <View style={styles.container}>
          <View style={styles.form}>
            {loginErro ? (
              <View style={styles.loginErrContainer}>
                <Text style={styles.loginErrtxt}>
                  Usuário ou Senha incorretos
                </Text>
              </View>
            ) : null}

            <Text style={{ alignSelf: 'flex-start', marginLeft: 7, color: 'white' }}>
              Nome de Usuário
            </Text>
            <TextInput 
              style={[styles.input, { borderColor: loginErro ? 'red' : 'black', paddingRight: '9%' }]}
              placeholder='Digite seu Nome'
              placeholderTextColor='grey'
              autoCapitalize="none"
              autoCorrect={false}   
              value={loginCredentials.usuarioL} 
              onChangeText={valor => credentialChange('usuarioL', valor, 'login')}
            />
            
            <Text style={{ alignSelf: 'flex-start', marginLeft: 7, color: 'white' }}>
              Senha
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <TextInput 
                style={[styles.inputPass, { borderColor: loginErro ? 'red' : 'black' }]}
                placeholder='Digite a senha'
                placeholderTextColor='grey'
                autoCapitalize="none" 
                autoCorrect={false} 
                secureTextEntry={!showPass} // Invertido para o padrão (escondido)
                value={loginCredentials.senhaL}
                onChangeText={valor => credentialChange('senhaL', valor, 'login')}
              />
              <Pressable 
                style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', width: '12%', borderTopRightRadius: 10, borderBottomRightRadius: 10 }} 
                onPress={() => setShowPass(!showPass)}>
                <Text><FontAwesome name={showPass ? 'eye-slash' : 'eye'} color={'gray'} size={23} /></Text>
              </Pressable>
            </View>
            
            <TouchableOpacity style={{ alignSelf: 'flex-end', borderBottomWidth: 1, borderColor: 'white' }}>
              <Text style={{ color: 'white' }}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.buttonConfirm} onPress={() => login()}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
} 

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  form: {
    width: '80%',
    alignItems: 'center'
  },
  input: {
    fontSize: 15, 
    marginBottom: 12, 
    paddingLeft: 8,
    width: '100%',
    borderRadius: 10,
    textAlign: 'left',
    backgroundColor: 'white',
  },
  inputPass: {
    backgroundColor: 'white',
    fontSize: 15, 
    paddingVertical: 10,
    paddingLeft: 8,
    width: '88%',
    borderColor: 'white',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    textAlign: 'left'
  },
  buttonContainer: {
    width: '100%',
    gap: 10, 
    marginTop: 10
  },
  loginErrContainer: {
    backgroundColor: '#ff4444',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 20,
  },
  loginErrtxt: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonConfirm: {
    backgroundColor: 'skyblue', 
    paddingVertical: 15, 
    borderRadius: 12,
    marginTop: 20, 
    alignItems: 'center'
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#333'
  },
  contai: {
    flex: 1,
    backgroundColor: 'rgb(5, 11, 32)'
  },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 50,
    marginLeft: 20,
    padding: 10,
    borderRadius: 15
  }
});

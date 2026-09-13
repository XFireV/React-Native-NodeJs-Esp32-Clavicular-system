import React, { useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { appContext } from '../../../../../context/appContext';

const MenuButton = ({ title, subtitle, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.textContainer}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
    <FontAwesome name="chevron-right" size={16} color="gray" />
  </TouchableOpacity>
);

export default function TeamConfig() {
  const { 
    equipeName, 
    nomeRascunho, 
    espIp, 
    ipRascunho, 
    valorInviteDados, 
    inviteRascunho, 
    valorSever, 
    serverRascunho,
    handleConfirmar 
  } = useContext(appContext);

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Configurações</Text>
      <Text style={styles.headerSubtitle}>{equipeName}</Text>

      <View style={{ marginTop: 30 }}>
        <MenuButton 
          title="Funcionalidades" 
          subtitle="Permissões e convites" 
          onPress={() => router.push('/team/configs/funcionalidades')} 
        />
        <MenuButton 
          title="Especificações" 
          subtitle="Nome da equipe e IP do aparelho" 
          onPress={() => router.push('/team/configs/especif')} 
        />
        <MenuButton 
          title="Acesso" 
          subtitle="Visibilidade do servidor" 
          onPress={() => router.push('/team/configs/acesso')} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(27, 34, 44)',
    paddingTop: 60,
  },
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 20,
  },
  headerSubtitle: {
    color: '#09eec8',
    fontSize: 16,
    paddingHorizontal: 20,
    marginTop: 5,
  },
  card: {
    backgroundColor: 'white',
    width: '90%',
    alignSelf: 'center',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 4,
  },
  textContainer: { flex: 1 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1B222C' },
  subtitle: { color: 'rgb(134, 134, 134)', fontSize: 13, marginTop: 4 },
  
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  btnSave: {
    backgroundColor: 'rgb(0, 153, 82)',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 5,
  },
  btnSaveText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
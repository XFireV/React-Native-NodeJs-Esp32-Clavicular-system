import { View, Image, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect, useContext } from 'react';
import { appContext } from '../../../../context/appContext';
import { supabase } from '../../../../supaBase/supa';
import { decode } from 'base64-arraybuffer';

export default function profile() {
  const [image, setImage] = useState(require('../../../../assets/profile.jpg'));
  const { usuarioL, exp } = useContext(appContext);

  useEffect(() => {
    loadProfileImage();
  }, [usuarioL]);

  async function loadProfileImage() {
    if (!usuarioL) return;

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('avatares')
        .eq('user', usuarioL)
        .single();

      if (data?.avatares) {
        const { data: urlData } = supabase.storage
          .from('avatar')
          .getPublicUrl(data.avatares);
        
        setImage(`${urlData.publicUrl}?t=${new Date().getTime()}`);
      }
    } catch (err) {
      console.log("Erro ao carregar imagem:", err);
    }
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert("Permissão necessária", "Precisamos de acesso às suas fotos.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6, 
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      uploadImage(asset);
    }
  };

  const uploadImage = async (asset) => {
    try {
      const fileExt = asset.uri.split('.').pop();
      const fileName = `${usuarioL}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const base64 = asset.base64;
      
      const { error: uploadError } = await supabase.storage
        .from('avatar')
        .upload(filePath, decode(base64), {
          contentType: `image/${fileExt}`,
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ avatares: filePath })
        .eq('user', usuarioL);

      if (updateError) throw updateError;
      const { data } = supabase.storage.from('avatar').getPublicUrl(filePath);
      setImage(`${data.publicUrl}?t=${new Date().getTime()}`);
      
      Alert.alert("Sucesso", "Foto de perfil atualizada!");

    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível salvar a imagem no servidor.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', marginTop: 75, marginLeft: 40 }}>
        <TouchableOpacity onPress={pickImage}>
          <Image 
            source={typeof image === 'string' ? { uri: image } : image} 
            style={styles.preview} 
          />
        </TouchableOpacity>
        
        <View style={{ flex: 1, marginTop: 12 }}>
          <View style={{ alignItems: 'center', flexDirection: 'row' }}>
            <Text style={styles.text}>{usuarioL}</Text>
          </View>
          <Text style={styles.text}>Nível 3</Text>
          <Text style={{ color: 'lightgray', fontSize: 14, marginLeft: 40, fontWeight: 'bold' }}>
            {exp} Exp
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'flex-start', justifyContent: 'flex-start', backgroundColor: '#090f1b', },
  preview: { marginBottom: 20, borderRadius: 100, width: 120, height: 120 },
  text: { fontSize: 20, fontWeight: 'bold', color: 'white', marginLeft: 40 }
});
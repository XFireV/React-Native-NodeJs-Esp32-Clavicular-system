import { FontAwesome } from '@expo/vector-icons';
import { useContext } from 'react'; 
import { Tabs } from 'expo-router';
import { appContext } from '../../../../context/appContext';
import { Ionicons } from '@expo/vector-icons';

export default function Layout() {
  const { logged } = useContext(appContext);

  return (
    <Tabs 
      initialRouteName="home"
      screenOptions={{ 
        tabBarStyle: { display: logged ? 'flex' : 'none' },
        headerShown: logged,
        tabBarStyle: {
          backgroundColor: 'black',
          borderTopWidth: 0,
          height: 100
        },
        tabBarActiveTintColor: 'white',
        headerShown: false
      }}
    >
      <Tabs.Screen name="index" options={{ href: null}} />
      <Tabs.Screen name="equip" options={{ href: null }} />
      <Tabs.Screen name="authid" options={{ href: null }} />
      <Tabs.Screen name="login" options={{ href: null }} />
      <Tabs.Screen name="creatingEquip" options={{ href: null }} />

      <Tabs.Screen
        name='home'
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name='home' color={color} size={size} />
          )
        }}
      />

      <Tabs.Screen
        name='social'
        options={{
          title: "Social",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name='users' color={color} size={size} />
          )
        }}
      />

      <Tabs.Screen
        name='jogo'
        options={{
          title: "jogo",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name='users' color={color} size={size} />
          )
        }}
      />

      <Tabs.Screen
        name='profile'
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-sharp" size={50} color="black" />
          )
        }}
      />

      <Tabs.Screen
        name='history'
        options={{
          title: "Histórico",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name='history' color={color} size={size} />
          )
        }}
      />

      <Tabs.Screen
        name='config'
        options={{
          title: "Configurações",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name='gear' color={color} size={size} />
          )
        }}
      />
    </Tabs>
  );
}
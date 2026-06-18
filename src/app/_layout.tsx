import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false, // Remove o header de todas as telas
        headerTitleAlign: 'center',
      }} 
    />
  );
}
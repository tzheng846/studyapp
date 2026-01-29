import { Stack } from "expo-router";

export default function TabsLayout() {
  return (
    <Stack>
      <Stack.Screen name="HomeScreen" options={{ headerShown: false }} />
      <Stack.Screen
        name="AccountHistoryScreen"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JoinSessionScreen"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LobbyScreen"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="ActiveSessionScreen"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="SessionSuccessScreen"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="SessionFailScreen"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}

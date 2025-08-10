import React from "react";
import { View } from "react-native";
import { Text, Card, Appbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <Appbar.Header>
        <Appbar.Content title="Profile & Settings" />
      </Appbar.Header>

      <View style={{ flex: 1, padding: 16 }}>
        <View style={{ marginBottom: 16 }}>
          <Card>
            <Card.Content>
              <Text variant="titleLarge" style={{ marginBottom: 8 }}>
                Inspector Profile
              </Text>
              <Text variant="bodyMedium">Name: John Smith</Text>
              <Text variant="bodyMedium">License: INS-2024-001</Text>
              <Text variant="bodyMedium">Company: Inspectrix Inc.</Text>
            </Card.Content>
          </Card>
        </View>

        <Card>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>
              App Settings
            </Text>
            <Text variant="bodyMedium">• Report templates</Text>
            <Text variant="bodyMedium">• AI preferences</Text>
            <Text variant="bodyMedium">• Export settings</Text>
          </Card.Content>
        </Card>
      </View>
    </SafeAreaView>
  );
}

import React from "react";
import { View } from "react-native";
import { Text, Button, Appbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateReportScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <Appbar.Header>
        <Appbar.Content title="Create New Report" />
      </Appbar.Header>

      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text
          variant="headlineMedium"
          style={{ marginBottom: 16, textAlign: "center" }}
        >
          Inspection Report Form
        </Text>
        <Text
          variant="bodyLarge"
          style={{ marginBottom: 24, textAlign: "center", color: "#666" }}
        >
          Coming soon - Full form with AI assistance
        </Text>
        <Button
          mode="contained"
          onPress={() => console.log("Form will go here")}
        >
          Start New Report
        </Button>
      </View>
    </SafeAreaView>
  );
}

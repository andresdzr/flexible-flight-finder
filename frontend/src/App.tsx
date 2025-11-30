import { ThemeProvider } from "@/components/ThemeProvider";
import { MapScreen } from "@/screens/MapScreen";
import "./App.css";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <MapScreen />
    </ThemeProvider>
  );
}

export default App;

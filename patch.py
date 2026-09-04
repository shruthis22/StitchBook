import re

path = r'c:\Users\shrut\OneDrive\Desktop\explosives\SSandCO explosives\app\(drawer)\_layout.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add imports
imports = '''import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { View, Image, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
'''
text = re.sub(r'import \{ Ionicons \} from \'@expo/vector-icons\';', 'import { Ionicons } from \'@expo/vector-icons\';\n' + imports, text)

# Add CustomDrawerContent
custom_drawer = '''
function CustomDrawerContent(props: any) {
  const insets = useSafeAreaInsets();
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
      <View style={{ 
        paddingTop: insets.top + 20, 
        paddingBottom: 20, 
        alignItems: 'center', 
        backgroundColor: '#000000' 
      }}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={{ width: 140, height: 140 }}
          resizeMode="contain"
        />
        <Text style={{ color: '#FFF', marginTop: 10, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 }}>SS & CO.</Text>
      </View>
      <View style={{ flex: 1, backgroundColor: '#FFF', paddingTop: 10 }}>
        <DrawerItemList {...props} />
      </View>
    </DrawerContentScrollView>
  );
}
'''
text = re.sub(r'export default function Layout\(\) \{', custom_drawer + '\nexport default function Layout() {', text)

# Add drawerContent prop
text = re.sub(r'(<Drawer\s*screenOptions=\{\{)', r'<Drawer drawerContent={(props) => <CustomDrawerContent {...props} />} screenOptions={{', text)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated drawer with logo')

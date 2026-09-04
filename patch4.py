import re

path = r'c:\Users\shrut\OneDrive\Desktop\explosives\SSandCO explosives\app\(drawer)\_layout.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace CustomDrawerContent completely
new_drawer = '''
function CustomDrawerContent(props: any) {
  const insets = useSafeAreaInsets();
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 0 }}>
      <View style={{ 
        paddingTop: insets.top + 30, 
        paddingBottom: 30, 
        alignItems: 'center', 
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
      }}>
        <View style={{
          width: 80,
          height: 80,
          transform: [{ rotate: '45deg' }],
          overflow: 'hidden',
          backgroundColor: '#000',
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 3.84,
        }}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={{ 
              width: 120, 
              height: 120, 
              transform: [{ rotate: '-45deg' }],
              marginLeft: -20,
              marginTop: -20
            }}
            resizeMode="cover"
          />
        </View>
      </View>
      <View style={{ flex: 1, backgroundColor: '#FFF', paddingTop: 10 }}>
        <DrawerItemList {...props} />
      </View>
    </DrawerContentScrollView>
  );
}
'''
text = re.sub(r'function CustomDrawerContent[\s\S]*?(?=\nexport default function Layout)', new_drawer, text)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated drawer layout with rhombus logo')

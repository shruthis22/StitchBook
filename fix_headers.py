import os
import re

files = [
    r'app\(drawer)\add-stock\index.tsx',
    r'app\(drawer)\add-customer\index.tsx',
    r'app\(drawer)\add\index.tsx',
    r'app\(drawer)\history\index.tsx',
    r'app\(drawer)\pending-payments\index.tsx',
    r'app\(drawer)\parties\index.tsx'
]

pattern = re.compile(
    r'<View style=\{styles\.header\}>\s*'
    r'<TouchableOpacity onPress=\{\(\) => navigation\.navigate\(\'dashboard\'\)\}>\s*'
    r'<Ionicons name="speedometer-outline" size=\{24\} color="#1F2937" \/>\s*'
    r'<\/TouchableOpacity>\s*'
    r'<Text style=\{styles\.headerTitle\}>(.*?)<\/Text>\s*'
    r'<View style=\{\{ width: 24 \}\} \/>\s*'
    r'<\/View>', re.DOTALL
)

replacement = r'''<View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
          <Ionicons name="menu" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>\1</Text>
        <TouchableOpacity onPress={() => navigation.navigate('dashboard')}>
          <Ionicons name="speedometer-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>'''

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # also need to make sure DrawerActions is imported if it was removed
        if "import { DrawerActions } from '@react-navigation/native';" not in content:
            content = content.replace("import { useNavigation }", "import { DrawerActions } from '@react-navigation/native';\nimport { useNavigation }")
            content = content.replace("import { useNavigation, useRouter }", "import { DrawerActions } from '@react-navigation/native';\nimport { useNavigation, useRouter }")

        new_content = pattern.sub(replacement, content)
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Updated {filepath}')
        else:
            print(f'No changes made to {filepath}')
    else:
        print(f'Not found {filepath}')

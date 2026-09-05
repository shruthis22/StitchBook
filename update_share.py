import os

filepath = r'utils\shareBill.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if "import { Alert } from 'react-native';" in content:
    content = content.replace("import { Alert } from 'react-native';", "import { Alert, Platform } from 'react-native';")

old_img_loading = """
    if (logoAsset.localUri) {
        try {
            const targetPath = FileSystem.cacheDirectory + 'logo_copy.png';
            await FileSystem.copyAsync({
                from: logoAsset.localUri,
                to: targetPath
            });

            const base64 = await FileSystem.readAsStringAsync(targetPath, {
                encoding: FileSystem.EncodingType.Base64,
            });
            logoBase64 = `data:image/png;base64,${base64}`;
        }
        catch (e: any) {
            console.error("Failed to load logo", e);
            Alert.alert("Logo Load Error", e.message || JSON.stringify(e));
        }
    }
"""

new_img_loading = """
    const watermarkAsset = Asset.fromModule(require('../assets/watermark.png'));
    await watermarkAsset.downloadAsync();
    let watermarkBase64 = "";

    try {
        if (Platform.OS === 'web') {
            logoBase64 = logoAsset.uri || '';
            watermarkBase64 = watermarkAsset.uri || '';
        } else {
            if (logoAsset.localUri) {
                const tempLogoPath = FileSystem.cacheDirectory + 'temp_logo_' + Date.now() + '.png';
                await FileSystem.copyAsync({ from: logoAsset.localUri, to: tempLogoPath });
                const base64 = await FileSystem.readAsStringAsync(tempLogoPath, { encoding: FileSystem.EncodingType.Base64 });
                logoBase64 = `data:image/png;base64,${base64}`;
            }
            if (watermarkAsset.localUri) {
                const tempWatermarkPath = FileSystem.cacheDirectory + 'temp_watermark_' + Date.now() + '.png';
                await FileSystem.copyAsync({ from: watermarkAsset.localUri, to: tempWatermarkPath });
                const base64 = await FileSystem.readAsStringAsync(tempWatermarkPath, { encoding: FileSystem.EncodingType.Base64 });
                watermarkBase64 = `data:image/png;base64,${base64}`;
            }
        }
    } catch (e: any) {
        console.error("Failed to load images", e);
    }
"""

if old_img_loading.strip() in content:
    content = content.replace(old_img_loading.strip(), new_img_loading.strip())

old_print = """
    const { uri } = await Print.printToFileAsync({ html });
    console.log('File has been saved to:', uri);
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
"""

new_print = """
    if (Platform.OS === 'web') {
        Alert.alert('Web Sharing', 'Direct sharing is not supported on Web. Please use the Print button and select "Save as PDF".');
        return;
    }
    const { uri } = await Print.printToFileAsync({ html });
    console.log('File has been saved to:', uri);
    await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
"""

if old_print.strip() in content:
    content = content.replace(old_print.strip(), new_print.strip())

# Also update the HTML template in shareBill.ts to exactly match printBill.ts if needed, or just let it use the old one but without breaking.
# Wait, if watermarkBase64 is injected, does the HTML have the watermark? 
# The HTML in shareBill might still be the old one. We should just copy printBill.ts's content to shareBill.ts and change the last 4 lines!

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated shareBill.ts")

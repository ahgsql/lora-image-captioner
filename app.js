import selectFolderDialog from './utils/folderSelect.js';
import { captionImagesInFolder } from './utils/image_caption.js';
import chalk from 'chalk';
import inquirer from 'inquirer';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    console.log(chalk.blue.bold('Resim Caption Uygulaması'));
    console.log(chalk.yellow('Lütfen işlenecek resimlerin bulunduğu klasörü seçin.'));

    try {
        const selectedFolder = await selectFolderDialog();
        if (!selectedFolder) {
            console.log(chalk.red('Klasör seçilmedi. Uygulama kapanıyor.'));
            return;
        }

        console.log(chalk.green(`Seçilen klasör: ${selectedFolder}`));

        const availableModels = process.env.VISION_MODELS.split(',');
        
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedModel',
                message: 'Hangi modeli kullanmak istiyorsunuz?',
                choices: availableModels,
            },
            {
                type: 'input',
                name: 'customPrompt',
                message: 'Özel bir prompt girmek ister misiniz? (Boş bırakırsanız varsayılan prompt kullanılacaktır)',
                default: 'Describe this image shortly.',
            },
            {
                type: 'confirm',
                name: 'renameImages',
                message: 'Resim adları numaralandırılsın mı?',
                default: false,
            },
            {
                type: 'input',
                name: 'prefix',
                message: 'Caption\'ların başına bir şey eklensin mi? (Boş bırakabilirsiniz)',
            },
            {
                type: 'input',
                name: 'suffix',
                message: 'Caption\'ların sonuna bir şey eklensin mi? (Boş bırakabilirsiniz)',
            },
        ]);

        const { selectedModel, customPrompt, renameImages, prefix, suffix } = answers;

        console.log(chalk.yellow('Resimler işleniyor...'));

        await captionImagesInFolder(
            selectedFolder, 
            selectedModel, 
            renameImages, 
            prefix ? prefix + ' ' : '', 
            suffix ? ' ' + suffix : '',
            customPrompt
        );

        console.log(chalk.green.bold('İşlem tamamlandı!'));
    } catch (error) {
        console.error(chalk.red('Bir hata oluştu:'), error);
    }
}

main();
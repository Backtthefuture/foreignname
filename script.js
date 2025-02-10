// 获取页面元素
const englishNameInput = document.getElementById('englishName');
const generateBtn = document.getElementById('generateBtn');
const loadingElement = document.getElementById('loading');
const resultsElement = document.getElementById('results');

// API配置
const API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-kawayxhkqiuvsbbsubflcjtqatwoyhvqftkvdcmlaxmdfsjj';
const API_URL = 'https://api.siliconflow.cn/v1/chat/completions';

// 生成中文名字的系统提示词
const SYSTEM_PROMPT = `你是一位精通中国传统文化的起名大师。请根据用户提供的英文名，生成3个独特的中文名字。
每个名字都应该：
1. 体现中国传统文化特色
2. 音韵优美
3. 寓意吉祥
4. 适合实际使用
5. 理解英文名字的含义，然后生成中文名字，并且有幽默成分，适当可以加一些梗 

请按以下格式返回结果（不要包含额外的解释）：
{
    "names": [
        {
            "chinese": "中文名1",
            "pinyin": "拼音1",
            "meaning_cn": "中文含义解释",
            "meaning_en": "English meaning explanation"
        },
        {
            "chinese": "中文名2",
            "pinyin": "拼音2",
            "meaning_cn": "中文含义解释",
            "meaning_en": "English meaning explanation"
        },
        {
            "chinese": "中文名3",
            "pinyin": "拼音3",
            "meaning_cn": "中文含义解释",
            "meaning_en": "English meaning explanation"
        }
    ]
}`;

// 处理生成名字的点击事件
generateBtn.addEventListener('click', async () => {
    const englishName = englishNameInput.value.trim();
    if (!englishName) {
        alert('请输入英文名');
        return;
    }

    // 显示加载动画
    loadingElement.style.display = 'block';
    resultsElement.style.display = 'none';
    generateBtn.disabled = true;

    try {
        const names = await generateChineseNames(englishName);
        displayResults(names);
    } catch (error) {
        console.error('生成名字时出错:', error);
        alert('生成名字时出错，请稍后重试');
    } finally {
        loadingElement.style.display = 'none';
        generateBtn.disabled = false;
    }
});

// 调用API生成中文名字
async function generateChineseNames(englishName) {
    try {
        console.log('Sending request to API...');
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'Pro/deepseek-ai/DeepSeek-R1',
                messages: [
                    {
                        role: 'system',
                        content: SYSTEM_PROMPT
                    },
                    {
                        role: 'user',
                        content: `请为英文名 "${englishName}" 生成中文名字`
                    }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Response not OK:', response.status, errorText);
            throw new Error(`API请求失败: ${response.status} ${errorText}`);
        }

        console.log('API response received');
        const data = await response.json();
        console.log('API response data:', data);

        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
            console.error('Invalid API response format:', data);
            throw new Error('API返回格式不正确');
        }

        let parsedNames;
        try {
            parsedNames = JSON.parse(data.choices[0].message.content);
        } catch (e) {
            console.error('Failed to parse names JSON:', data.choices[0].message.content);
            throw new Error('名字数据格式不正确');
        }

        if (!parsedNames.names || !Array.isArray(parsedNames.names)) {
            console.error('Invalid names data structure:', parsedNames);
            throw new Error('生成的名字数据结构不正确');
        }

        return parsedNames;
    } catch (error) {
        console.error('Error in generateChineseNames:', error);
        throw error;
    }
}

// 在页面上显示结果
function displayResults(data) {
    resultsElement.innerHTML = '';
    
    data.names.forEach((name, index) => {
        const nameCard = document.createElement('div');
        nameCard.className = 'name-card';
        nameCard.innerHTML = `
            <h2>${name.chinese}</h2>
            <p class="pinyin">
                <span class="text-en">Pinyin: </span>
                <span class="text-cn">拼音：</span>
                ${name.pinyin}
            </p>
            <div class="meaning">
                <h3>
                    <span class="text-en">Cultural Meaning</span>
                    <span class="text-cn">文化寓意</span>
                </h3>
                <p class="text-cn">${name.meaning_cn}</p>
                <h3>
                    <span class="text-en">English Explanation</span>
                    <span class="text-cn">英文解释</span>
                </h3>
                <p class="text-en">${name.meaning_en}</p>
            </div>
        `;
        resultsElement.appendChild(nameCard);
    });

    resultsElement.style.display = 'block';
}

// 输入框回车触发生成
englishNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !generateBtn.disabled) {
        generateBtn.click();
    }
});

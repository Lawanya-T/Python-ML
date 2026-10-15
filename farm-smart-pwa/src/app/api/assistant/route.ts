// src/app/api/assistant/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { message, history, context } = await req.json();
  const apiKey = process.env.SARVAM_API_KEY;
  const languageNames: Record<string, string> = {
    en: "English",
    hi: "Hindi",
    kn: "Kannada",
    mr: "Marathi",
    ta: "Tamil",
    pa: "Punjabi",
    bn: "Bengali",
    te: "Telugu",
    gu: "Gujarati",
  };
  const responseLanguage = languageNames[context?.language] ?? "English";

  const fallbackReplies: Record<string, { generic: string; moisture: string; irrigation: string; weather: string; crop: string; pest: string }> = {
    en: {
      generic: "Check soil moisture, crop stage, and the local weather before making a farm decision. A simple field check and early morning irrigation usually gives the best result.",
      moisture: "For most crops, keep soil moisture around 40% to 50%; irrigate when it drops below the crop's lower target and avoid watering at midday.",
      irrigation: "Irrigate early in the morning for about 25 minutes today using drip irrigation to reduce evaporation and save water.",
      weather: "If rain is expected within the next 24 hours, reduce irrigation and avoid heavy watering so the soil does not become waterlogged.",
      crop: "Healthy crops need the right moisture, sunlight, and nutrient balance. Keep the root zone moist, monitor leaf stress, and apply nutrient support based on crop stage.",
      pest: "Inspect leaves, stems, and soil early in the morning for pest damage. Remove affected plants, improve airflow, and use targeted treatment only when needed.",
    },  
    hi: {
      generic: "फसल के लिए मिट्टी की नमी, फसल की अवस्था और स्थानीय मौसम को देखें। सरल खेत निरीक्षण और सुबह के समय सिंचाई अक्सर सबसे अच्छा परिणाम देती है।",
      moisture: "अधिकांश फसलों के लिए मिट्टी की नमी 40% से 50% के बीच रखें; जब यह कम हो जाए तो सिंचाई करें और दोपहर में पानी न दें।",
      irrigation: "आज सुबह जल्दी करीब 25 मिनट तक ड्रिप सिंचाई करें ताकि पानी कम लगे और वाष्पीकरण कम हो।",
      weather: "अगर अगले 24 घंटों में बारिश का अनुमान है, तो सिंचाई कम करें और भारी पानी से बचें ताकि मिट्टी जलभराव में न जाए।",
      crop: "स्वस्थ फसल के लिए सही नमी, धूप और पोषक तत्व जरूरी हैं। जड़ क्षेत्र को नम रखें, पत्तियों की स्थिति देखें और फसल की अवस्था के अनुसार पोषक उपचार दें।",
      pest: "सुबह जल्दी पत्तियों, तनों और मिट्टी की जांच करें। प्रभावित हिस्से हटाएं, हवा का प्रवाह बेहतर करें और जरूरत पर ही लक्षित इलाज करें।",
    },
    kn: {
      generic: "ಹೊಲದ ನಿರ್ಧಾರಕ್ಕೆ ಮಣ್ಣಿನ ತೇವಾಂಶ, ಬೆಳೆದ ಹಂತ ಮತ್ತು ಸ್ಥಳೀಯ ಹವಾಮಾನವನ್ನು ಗಮನಿಸಿ. ಸರಳfält ಪರಿಶೀಲನೆ ಮತ್ತು ಬೆಳಗಿನ ನೀರಾವರಿ ಉತ್ತಮ ಫಲಿತಾಂಶ ನೀಡುತ್ತದೆ.",
      moisture: "ಹಲವು ಬೆಳೆಗಳಿಗೆ ಮಣ್ಣಿನ ತೇವಾಂಶ 40%–50% ನಡುವೆ ಇರಬೇಕು; ಇಳಿಕೆ ಕಂಡಲ್ಲಿ ನೀರು ನೀಡಿ ಮತ್ತು ಮಧ್ಯಾಹ್ನ ನೀರು ಬಿಡಬೇಡಿ.",
      irrigation: "ಇಂದು ಬೆಳಗಾಗಿಯೇ ಸುಮಾರು 25 ನಿಮಿಷ 드ಿಪ್ ನೀರಾವರಿ ಮಾಡಿ; ಇದು ಆವಿಯುವಿಕೆಯನ್ನು ಕಡಿಮೆಮಾಡಿ ನೀರನ್ನು ಉಳಿಸುತ್ತದೆ.",
      weather: "ಮುಂದಿನ 24 ಗಂಟೆಗಳಲ್ಲಿ ಮಳೆ ಬರುವುದಾದರೆ ನೀರಾವರಿಯನ್ನು ಕಡಿಮೆ ಮಾಡಿ ಮತ್ತು ಮಣ್ಣು ಕೊಳುಕು ಆಗದಂತೆ ಗಮನಿಸಿ.",
      crop: "ಆರಾಮದಾಯಕ ಬೆಳೆಗಾಗಿ ಸರಿಯಾದ ತೇವಾಂಶ, ಸೂರ್ಯ ಬೆಳಕು ಮತ್ತು ಪೋಷಕಾಂಶಗಳ ಸರಿಯಾಗಿ ಸಮತೋಲನ ಮುಖ್ಯ. ಬೇರುಗಳ ಪ್ರದೇಶದ ತೇವಾಂಶ ಮತ್ತು ಎಲೆಗಳ ಸ್ಥಿತಿಯನ್ನು ನಿಯಮಿತವಾಗಿ ಪರಿಶೀಲಿಸಿ.",
      pest: "ಬೆಳಗಿನ ಜಾವದಲ್ಲಿ ಎಲೆಗಳು, ಕಾಂಡಗಳು ಮತ್ತು ಮಣ್ಣನ್ನು ಪರಿಶೀಲಿಸಿ. ಪರಿಣಾಮಿತ ಭಾಗಗಳನ್ನು ತೆಗೆಯಿರಿ, ಗಾಳಿಯ ಸಂಚಾರವನ್ನು ಹೆಚ್ಚಿಸಿ ಮತ್ತು ಅಗತ್ಯವಿದ್ದಾಗ ಮಾತ್ರ ಗುರಿತ ಚಿಕಿತ್ಸೆ ನೀಡಿರಿ.",
    },
    mr: {
      generic: "शेताचे निर्णय घेण्यापूर्वी मातीची ओल, पिकांची अवस्था आणि स्थानिक हवामान पाहा. सोपी शेत तपासणी आणि सकाळची सिंचन हे नेहमी चांगले परिणाम देते.",
      moisture: "बहुतेक पिकांसाठी मातीची ओल 40% ते 50% दरम्यान ठेवा; ती कमी झाल्यावर सिंचन करा आणि दुपारी पाणी देऊ नका.",
      irrigation: "आज सकाळी लवकर सुमारे 25 मिनिटे ड्रिप सिंचन करा; यामुळे पाण्याचे वाष्पीकरण कमी होते.",
      weather: "जर पुढील 24 तासांत पाऊस अपेक्षित असेल, तर सिंचन कमी करा आणि जास्त पाणी देऊ नका, जेणेकरून माती गाळू नये.",
      crop: "सुदृढ पिकांसाठी योग्य ओल, सूर्यप्रकाश आणि पोषक घटक महत्त्वाचे आहेत. मुळांच्या क्षेत्राची ओल आणि पानांची स्थिती तपासा.",
      pest: "सकाळच्या वेळी पानं, खोड आणि माती तपासा. प्रभावित भाग काढून टाका, हवा सुटणे वाढवा आणि गरजेनुसारच उपचार करा.",
    },
    ta: {
      generic: "வயலின் முடிவை எடுப்பதற்கு மண் ஈரப்பதம், பயிர் நிலை மற்றும் உள்ளூர் வானிலை ஆகியவற்றை பார்க்கவும். எளிய வயல் ஆய்வு மற்றும் அதிகாலை பாசனம் சிறந்த முடிவை தரும்.",
      moisture: "பெரும்பாலான பயிர்களுக்கு மண் ஈரப்பதம் 40% முதல் 50% இடையே இருக்க வேண்டும்; குறைந்தால் பாசனம் செய்யுங்கள், மதிய வேளையில் தண்ணீர் விடாதீர்கள்.",
      irrigation: "இன்று அதிகாலையில் சுமார் 25 நிமிடங்கள் டிரிப் பாசனம் செய்யுங்கள்; இது ஆவியாதலை குறைத்து தண்ணீரை சேமிக்கும்.",
      weather: "அடுத்த 24 மணி நேரத்தில் மழை வர வாய்ப்பிருப்பின், பாசனத்தை குறைத்து, அதிக தண்ணீரை தவிர்க்கவும்; இதனால் மண் நீர் நிறைந்துவிடாது.",
      crop: "சுகாதாரமான பயிர்களுக்கு சரியான ஈரப்பதம், சூரிய ஒளி மற்றும் ஊட்டச்சத்து சமநிலை அவசியம். வேர் பகுதிக்கு ஈரப்பதம் கொடுத்து, இலைகளின் நிலைமையை கண்காணியுங்கள்.",
      pest: "காலை நேரத்தில் இலைகள், தண்டுகள் மற்றும் மண்ணை பரிசோதிக்கவும். பாதிக்கப்பட்ட பகுதிகளை அகற்றி, காற்றோட்டத்தை மேம்படுத்து, அவசியமான போது மட்டுமே இலக்கு சிகிச்சை பயன்படுத்தவும்.",
    },
    pa: {
      generic: "ਖੇਤ ਦੇ ਫੈਸਲੇ ਤੋਂ ਪਹਿਲਾਂ ਮਿੱਟੀ ਦੀ ਨਮੀ, ਫਸਲ ਦੀ ਸਥਿਤੀ ਅਤੇ ਸਥਾਨਕ ਮੌਸਮ ਨੂੰ ਦੇਖੋ। ਸੌਖੀ ਖੇਤ ਜਾਂਚ ਅਤੇ ਸਵੇਰੇ ਦੀ ਸਿੰਚਾਈ ਅਕਸਰ ਬਿਹਤਰ ਨਤੀਜਾ ਦਿੰਦੀ ਹੈ।",
      moisture: "ਬਹੁਤੀਆਂ ਫਸਲਾਂ ਲਈ ਮਿੱਟੀ ਦੀ ਨਮੀ 40% ਤੋਂ 50% ਦੇ ਵਿੱਚ ਰੱਖੋ; ਜਦੋਂ ਇਹ ਘੱਟ ਹੋਵੇ ਤਾਂ ਸਿੰਚਾਈ ਕਰੋ ਅਤੇ ਦੁਪਹਿਰ ਵਿੱਚ ਪਾਣੀ ਨਾ ਦਿਓ।",
      irrigation: "ਅੱਜ ਸਵੇਰੇ ਲਗਭਗ 25 ਮਿੰਟ ਡ੍ਰਿੱਕ ਸਿੰਚਾਈ ਕਰੋ; ਇਸ ਨਾਲ ਪਾਣੀ ਦੇ ਵਾਸ਼ਪੀਕਰਨ ਨੂੰ ਕਮ ਕੀਤਾ ਜਾ ਸਕਦਾ ਹੈ।",
      weather: "ਜੇਕਰ ਅਗਲੇ 24 ਘੰਟਿਆਂ ਵਿੱਚ ਬਰਿਸ਼ ਦੀ ਸੰਭਾਵਨਾ ਹੋਵੇ ਤਾਂ ਸਿੰਚਾਈ ਘਟਾਈਏ ਅਤੇ ਜ਼ਿਆਦਾ ਪਾਣੀ ਨਾ ਦਿਓ, ਤਾਂ ਕਿ ਮਿੱਟੀ ਵਿੱਚ ਪਾਣੀ ਨਾ ਲੱਗੇ।",
      crop: "ਸਵਸਥ ਫਸਲਾਂ ਲਈ ਸਹੀ ਨਮੀ, ਸੂਰਜ ਦੀ ਰੋਸ਼ਨੀ ਅਤੇ ਪੋਸ਼ਣਾਤਮਕ ਗੁਣ ਜ਼ਰੂਰੀ ਹਨ। ਜੜਾਂ ਦੇ ਖੇਤਰ ਦੀ ਨਮੀ ਅਤੇ ਪੱਤਿਆਂ ਦੀ ਹਾਲਤ ਦੀ ਨਿਰੀਖਣ ਕਰੋ।",
      pest: "ਸਵੇਰੇ ਪੱਤਿਆਂ, ਤੰਬੇ ਅਤੇ ਮਿੱਟੀ ਦੀ ਜਾਂਚ ਕਰੋ। ਪ੍ਰਭਾਵਤ ਹਿੱਸੇ ਹਟਾਓ, ਹਵਾ ਦੇ ਵਹਣ ਨੂੰ ਬਿਹਤਰ ਬਣਾਓ ਅਤੇ ਲੋੜ ਨੂੰ ਹੀ ਟੀਕਾ ਉਪਚਾਰ ਕਰੋ।",
    },
    bn: {
      generic: "খেতের সিদ্ধান্ত নেওয়ার আগে মাটির আর্দ্রতা, ফসলের অবস্থা এবং স্থানীয় আবহাওয়া দেখুন। সহজ মাঠ পরীক্ষা এবং সকালে সেচ সাধারণত ভালো ফল দেয়।",
      moisture: "বেশিরভাগ ফসলের জন্য মাটির আর্দ্রতা 40% থেকে 50% মধ্যে রাখুন; কমে গেলে সেচ দিন এবং দুপুরে পানি দেবেন না।",
      irrigation: "আজ সকালে প্রায় ২৫ মিনিট ড্রিপ সেচ দিন; এতে পানি বাষ্পীভূত কম হয় ও জল বাঁচে।",
      weather: "যদি আগামী ২৪ ঘণ্টায় বৃষ্টি আশা করা হয়, সেচ কমিয়ে দিন এবং ভারী পানি দেওয়া এড়িয়ে চলুন যাতে মাটি জলাবদ্ধ না হয়।",
      crop: "সুস্থ চাষের জন্য সঠিক আর্দ্রতা, সূর্যালোক এবং পুষ্টির ভারসাম্য জরুরি। শিকড়ের এলাকায় আর্দ্রতা রাখুন এবং পাতার অবস্থা পর্যবেক্ষণ করুন।",
      pest: "সকালে পাতা, কান্ড এবং মাটি পরীক্ষা করুন। আক্রান্ত অংশ সরিয়ে ফেলুন, বায়ু চলাচল বাড়ান, এবং প্রয়োজনে নির্দিষ্ট কীটনাশক ব্যবহার করুন।",
    },
    te: {
      generic: "పొలాల నిర్ణయం తీసుకునే ముందు మట్టి తేమ, పంట స్థితి మరియు స్థానిక వాతావరణాన్ని పరిశీలించండి. సరళమైన పొలం గమనించి, ఉదయం నీటిపారుదల చాలా మంచివి.",
      moisture: "చాలా పంటలకు మట్టి తేమ 40%–50% మధ్య ఉండాలి; తగ్గితే నీటిపారుదల చేయండి, మధ్యాహ్నంలో నీరు ఇవ్వకండి.",
      irrigation: "ఈరోజు ఉదయాన్నే సుమారు 25 నిమిషాలు డ్రిప్ నీటిపారుదల చేయండి; ఇది ఆవిరి తగ్గించి నీటిని ఆదా చేస్తుంది.",
      weather: "మరుసటి 24 గంటల్లో వర్షం ఉంటే నీటిపారుదల తగ్గించండి, భారీ నీరు ఇవ్వకండి; తద్వారా మట్టిలో నీరు నిల్వపు కాకుండా చూసుకోవచ్చు.",
      crop: "స్వస్థిత పంటలకు సరైన తేమ, సూర్యరశ్మి మరియు పోషకాల సమతుల్యత ముఖ్యం. వేరు ప్రాంతంలో తేమను ఉంచి, ఆకుల స్థితిని పర్యవేక్షించండి.",
      pest: "ఉదయాన్నే ఆకులు, కాండం మరియు మట్టిని పరిశీలించండి. ప్రభావిత భాగాలను తొలగించి, గాలి ప్రసరణను మెరుగుపరచండి, అవసరమైనప్పుడు మాత్రమే లక్ష్యపరమైన చికిత్స చేయండి.",
    },
    gu: {
      generic: "ખેતરની પસંદગી પહેલાં માટીની ભેજ, પાકની સ્થિતિ અને સ્થાનિક હવામાન જુઓ. સરળ ખેતરની inspeક્શન અને સવારે સિંચાઈ મોટાભાગે સારું પરિણામ આપે છે.",
      moisture: "મોટાભાગના પાક માટે માટીની ભેજ 40% થી 50% વચ્ચે રાખવી જોઈએ; જ્યારે તે નીચે જશે ત્યારે સિંચાઈ કરો અને બપોરે પાણી ન આપો.",
      irrigation: "આજે વહેલાં સવારમાં લગભગ 25 મિનિટ ડ્રિપ સિંચાઈ કરો; આથી પાણીનું વહન અને વરાળતા ઘટાડે છે.",
      weather: "જો આગામી 24 કલાકમાં વરસાદની સંભાવના હોય તો સિંચાઈ ઘટાડી દો અને ભારે પાણી આપતા બચો, જેથી માટી ભારે ન થાય.",
      crop: "સ્વસ્થ પાક માટે યોગ્ય ભેજ, સૂર્યપ્રકાશ અને પોષક તત્ત્વો મહત્વના છે. મૂળ વિસ્તારમાં ભેજ રાખો અને પાંદડાની સ્થિતિનું નિરીક્ષણ કરો.",
      pest: "સવારમાં પાંદડા, ડાળ અને માટી તપાસો. પ્રભાવિત ભાગ દૂર કરો, હવાકરણ સુધારો અને જરૂર પડ્યે જ લક્ષિત ઉપચાર કરો.",
    },
  };

  const buildFallbackReply = (userMessage: string, lang: string) => {
    const languageKey = Object.prototype.hasOwnProperty.call(fallbackReplies, lang) ? lang : "en";
    const lower = String(userMessage ?? "").toLowerCase();
    if (lower.includes("moisture") || lower.includes("soil") || lower.includes("dry") || lower.includes("wet")) {
      return fallbackReplies[languageKey].moisture;
    }
    if (lower.includes("water") || lower.includes("irrigate") || lower.includes("schedule") || lower.includes("when should") || lower.includes("time")) {
      return fallbackReplies[languageKey].irrigation;
    }
    if (lower.includes("weather") || lower.includes("rain") || lower.includes("cloud") || lower.includes("forecast")) {
      return fallbackReplies[languageKey].weather;
    }
    if (lower.includes("pest") || lower.includes("disease") || lower.includes("insect") || lower.includes("leaf")) {
      return fallbackReplies[languageKey].pest;
    }
    if (lower.includes("crop") || lower.includes("fertilizer") || lower.includes("nutrient") || lower.includes("seed") || lower.includes("harvest")) {
      return fallbackReplies[languageKey].crop;
    }
    return fallbackReplies[languageKey].generic;
  };

  const systemPrompt = `You are a helpful farming assistant for an irrigation and farm management app. Answer the user's question directly in ${responseLanguage}. You may help with irrigation scheduling, soil moisture, weather, crop care, pests, nutrients, planting, harvest planning, and general farm decisions. Keep answers short, practical, and specific. Do not tell the user to check another page, open a card, or solve it alone. Current farmer context: ${JSON.stringify(context)}`;

  try {
    if (!apiKey) {
      throw new Error("SARVAM_API_KEY is not configured");
    }

    const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        model: "sarvam-30b",
        messages: [
          { role: "system", content: systemPrompt },
          ...(history ?? []),
          { role: "user", content: message },
        ],
        temperature: 0.3,
      }),
    });

    if (!res.ok) throw new Error(`Sarvam chat error: ${res.status}`);
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't process that.";
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({
      reply: buildFallbackReply(message, context?.language ?? "en"),
      fallback: true,
      reason: "offline",
    });
  }
}
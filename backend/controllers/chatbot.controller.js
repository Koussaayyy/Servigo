const Groq = require("groq-sdk");
const User = require("../models/User.model");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.chat = async (req, res) => {
  try {
    const { message, city } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: "Message requis" });

    // Fetch approved, active, available workers
    const filter = { role: "worker", isActive: true, "workerVerification.status": "approved" };
    if (city) filter["workerProfile.city"] = { $regex: `^${city}$`, $options: "i" };

    const workers = await User.find(filter)
      .select("firstName lastName workerProfile.professions workerProfile.city workerProfile.rating workerProfile.totalReviews workerProfile.bio workerProfile.isAvailable")
      .lean();

    const workerList = workers.map((w) => ({
      id: String(w._id),
      name: `${w.firstName} ${w.lastName}`.trim(),
      professions: w.workerProfile?.professions || [],
      city: w.workerProfile?.city || "",
      rating: w.workerProfile?.rating || 0,
      totalReviews: w.workerProfile?.totalReviews || 0,
      bio: w.workerProfile?.bio || "",
      available: w.workerProfile?.isAvailable !== false,
    }));

    const workersJson = JSON.stringify(workerList, null, 2);

    const systemPrompt = `Tu es l'assistant intelligent de Servigo, une marketplace de services à domicile en Tunisie.
Ton rôle est d'aider les utilisateurs à trouver le meilleur prestataire pour leur problème.

Voici la liste des prestataires disponibles sur la plateforme :
${workersJson}

Instructions :
- Réponds toujours en français, de manière conviviale et concise.
- Analyse le problème de l'utilisateur et identifie le type de service requis.
- Suggère les prestataires les mieux adaptés en tenant compte de leurs professions, leur note et leur ville.
- Explique brièvement pourquoi tu les recommandes.
- Si aucun prestataire ne correspond, donne des conseils généraux.
- À la fin de ta réponse, ajoute OBLIGATOIREMENT un bloc JSON de cette forme exacte (même si vide) :
{"recommended_ids": ["id1", "id2"]}
Ce bloc doit contenir uniquement les IDs des prestataires que tu recommandes (max 3).`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message.trim() },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content || "";

    // Extract recommended IDs from the JSON block
    let recommendedIds = [];
    const jsonMatch = text.match(/\{"recommended_ids"\s*:\s*\[([^\]]*)\]\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        recommendedIds = parsed.recommended_ids || [];
      } catch {}
    }

    // Clean response text (remove the JSON block for display)
    const cleanText = text.replace(/\{"recommended_ids"\s*:\s*\[[^\]]*\]\}/g, "").trim();

    // Fetch full worker data for recommended workers
    const fullWorkers = await User.find({ _id: { $in: recommendedIds } })
      .select("-password -clientProfile")
      .lean();

    res.json({ reply: cleanText, recommendedWorkers: fullWorkers });
  } catch (err) {
    console.error("❌ Chatbot error:", err);
    res.status(500).json({ message: "Erreur du chatbot", error: err.message });
  }
};

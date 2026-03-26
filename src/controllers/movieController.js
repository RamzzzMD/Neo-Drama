const axios = require('axios');

const API_BASE = 'https://api.sansekai.my.id/api/moviebox';

exports.getHome = async (req, res) => {
    try {
        const { data } = await axios.get(`${API_BASE}/homepage`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTrending = async (req, res) => {
    try {
        const { data } = await axios.get(`${API_BASE}/trending`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSearch = async (req, res) => {
    try {
        const { query, page = 1 } = req.query;
        const { data } = await axios.get(`${API_BASE}/search?query=${encodeURIComponent(query)}&page=${page}`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getDetail = async (req, res) => {
    try {
        const { subjectId } = req.query;
        const { data } = await axios.get(`${API_BASE}/detail?subjectId=${subjectId}`);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStream = async (req, res) => {
    try {
        const { subjectId, season = 0, episode = 0 } = req.query;
        
        // 1. Ambil Source Downloads & Captions
        const sourceUrl = `${API_BASE}/sources?subjectId=${subjectId}&season=${season}&episode=${episode}`;
        const { data: sourceData } = await axios.get(sourceUrl);
        
        if (!sourceData || !sourceData.downloads || sourceData.downloads.length === 0) {
            return res.status(404).json({ error: "Sumber video tidak ditemukan." });
        }
        
        // 2. Cari URL download beresolusi paling tinggi
        const bestSource = sourceData.downloads[sourceData.downloads.length - 1];
        const dlUrl = bestSource.url;
        
        // 3. Ekstrak URL Subtitle Indonesia (lan: "id" atau "Indonesian")
        let subtitleUrl = null;
        if (sourceData.captions) {
            const indoCap = sourceData.captions.find(c => c.lan === 'id' || c.lanName === 'Indonesian');
            if (indoCap) {
                // Diarahkan ke proxy internal kita untuk diconvert ke WebVTT
                subtitleUrl = `/api/subtitle?url=${encodeURIComponent(indoCap.url)}`;
            }
        }

        // 4. Generate URL Streaming Final
        const genUrl = `${API_BASE}/generate-link-stream-video?url=${encodeURIComponent(dlUrl)}`;
        const { data: genData } = await axios.get(genUrl);

        res.json({
            success: true,
            streamUrl: genData.streamUrl,
            subtitleUrl: subtitleUrl
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSubtitle = async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) return res.status(400).send("URL subtitle tidak tersedia.");
        
        const { data: srtData } = await axios.get(url);
        
        // Konversi format waktu SRT (,) ke WebVTT (.) agar didukung HTML5 Video native
        const vttData = "WEBVTT\n\n" + srtData.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
        
        res.header('Content-Type', 'text/vtt; charset=utf-8');
        res.send(vttData);
    } catch (err) {
        res.status(500).send("");
    }
};

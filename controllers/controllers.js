const db = require('../database/db');

const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: "error",
                message: "Tidak ada file gambar yang diunggah"
            });
        }

        const { title } = req.body;
        const file = req.file;
        const user_id = req.user.uid;
        
        if (!title) {
            return res.status(400).json({
                status: "error",
                message: "Judul dibutuhkan"
            });
        }

        let description = '';
        if (title.toLowerCase() === 'cabe merah') {
            description = "Ini deskripsi cabe merah";
        } else if (title.toLowerCase() === 'cabe hijau') {
            description = "Ini deskripsi cabe hijau";
        } else {
            description = "Deskripsi tidak tersedia";
        }

        const imageUrl = `../uploads/${file.filename}`;

        const query = `INSERT INTO images (user_id, image_url, title, description) VALUES (?, ?, ?, ?)`;
        db.query(query, [user_id, imageUrl, title, description], (err, result) => {
            if (err) {
                console.log("Error:", err);
                return res.status(400).json({
                    status: "error",
                    message: "Error menambahkan metadata gambar ke database"
                });
            }

            res.status(201).json({
                status: "success",
                message: "Berhasil mengunggah gambar",
                data: {
                    user_id,
                    image_url: imageUrl,
                    title,
                    description
                }
            });
        });

    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

const getImage = (req, res) => {
    const { title } = req.query;
    const user_id = req.user.uid;

    if (!title) {
        console.log("Error:", err);
        return res.status(400).json({ status: 'error', message: 'Title harus diisi' });
    }

    const query = `SELECT image_url, title, description FROM images WHERE user_id = ? AND title = ?`;
    db.query(query, [user_id, title], (err, result) => {
        if (err) {
            console.log("Error:", err);
            return res.status(400).json({ status: 'error', message: 'Gagal menampilkan data' });
        }

        if (result.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Tidak ada gambar untuk title tersebut'
            });
        }

        res.status(200).json({
            status: "success",
            message: "Berhasil menampilkan gambar",
            data: result
        });
    });
};

const getHistory = (req, res) => {
    const user_id = req.user.uid;

    if (!user_id) {
        console.log("User ID tidak ditemukan");
        return res.status(400).json({ status: 'error', message: 'Masukkan user ID' });
    }

    const query = `SELECT image_url, title, description FROM images WHERE user_id = ?`;
    db.query(query, [user_id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(400).json({ status: 'error', message: 'Gagal menampilkan data' });
        }

        if (result.length === 0) {
            console.log("Data tidak ditemukan untuk user_id:", user_id);
            return res.status(404).json({ status: 'error', message: 'Data tidak ditemukan' });
        }

        res.status(200).json({
            status: "success",
            message: "Berhasil menampilkan data",
            data: result
        });
    });
};

module.exports = { uploadImage, getImage, getHistory };

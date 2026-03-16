//Function to search user
export const searchUsers = async (req, res) => {
    const { query } = req.query; // e.g., /search?query=React
    
    try {
        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { subjects: { $in: [new RegExp(query, "i")] } }
            ]
        }).select("name profilePicture subjects skillLevel");

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
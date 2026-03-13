import Group from "@/app/models/Group";
import User from "@/app/models/User";

// ACTION: Create Group
export const createGroup = async (req, res) => {
    try {
        const group = await Group.create({
            ...req.body,
            admin: req.user.id, // ID from your auth middleware
            members: [req.user.id]
        });
        res.status(201).json(group);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// ACTION: Join Group (With Credit & Capacity Checks)
export const joinGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId);
        const user = await User.findById(req.user.id);

        if (group.members.length >= group.maxMembers) {
            return res.status(400).json({ message: "Group is full" });
        }
        if (user.credits < group.minCreditPoints) {
            return res.status(403).json({ message: "Not enough credit points" });
        }

        group.members.push(req.user.id);
        await group.save();
        res.status(200).json({ message: "Joined successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
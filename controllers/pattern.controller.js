import { createRequire } from "module";
const require = createRequire(import.meta.url);
import Pattern from "../models/pattern.model";

export const save = async (req, res) => {
    const { pattern } = req.body;

    try {
        await Pattern.findByIdAndUpdate(pattern._id, pattern);
        res.json({
            result: true,
            payload: pattern
        })
    } catch (err) {
        res.status(500).json({
            result: false,
            payload: 'Database error!'
        })
    }
}
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const express = require('express');
import * as auth from "../middleware/auth";
const router = express.Router();
import * as WalletController from '../controllers/wallet.controller';

router.use(auth.verifyToken).post('/add', WalletController.addWallet);
router.use(auth.verifyToken).post('/del', WalletController.delWallet);
router.use(auth.verifyToken).post('/update', WalletController.updateWallet);
router.use(auth.verifyToken).post('/gets', WalletController.getWallets);


export default router;
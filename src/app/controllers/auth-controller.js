
const userService = require('../services/auth/auth.service');
const authMidleware = require('../middlewares/auth');
const bcrypt = require('bcryptjs/dist/bcrypt');
const crypto = require('crypto');
const dotenv = require('dotenv');
const teamService = require('../services/teams/teams.service');
const emailService = require('../services/emails/email-service');

exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    try {

        const user = await userService.login(email);
        if (!user) {
            var error = 'Usuário nao encontrado';
            return res.status(400).send({ error });
        }
        if (!await bcrypt.compare(password, user.password)) {
            var error = 'Senha inválida';
            return res.status(400).send({ error: 'Senha inválida' });
        }
        user.password = undefined;

        const roles = await teamService.findUserTeam(user.id);


        if (roles) {
            res.status(200).send({
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                url: user.url,
                role: user.roles,
                idTeam: roles.id,
                rolesTeam: roles.role,

                token: authMidleware.generateToken({
                    id: user.id,
                    email: user.email,
                    nickname: user.nickname,
                    url: user.url,
                })
            })
        }
        if (!roles) {
            res.status(200).send({
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                url: user.url,
                role: user.roles,
                idTeam: '',
                rolesTeam: '',

                token: authMidleware.generateToken({
                    id: user.id,
                    email: user.email,
                    nickname: user.nickname,
                    url: user.url,
                })
            })
        }


    } catch (error) {
        console.log(error);
        res.status(400).send({ error: 'Login falhou' })
    }
}
exports.forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    try {
        const user = await userService.forgotPass({ email });
        if (!user)
            return res.status(400).send({ error: 'Usuário nao encontrado' });
        const token = crypto.randomBytes(40).toString('hex');

        const now = new Date();
        now.setHours(now.getHours() + 1);

        const data = await userService.forgotPassword(user.id, token, now);

       

        const crypt = authMidleware.generateToken({ email, token })

        const url = `${process.env.APP_URL}/reset-password/${crypt}`;


        const message = emailService.forgotPassword(data, url);
        emailService.sendEmail(message);

        return res.status(200).send({ message: 'troca de senha solicitado com sucesso' });

    } catch (error) {
        console.log(error);
        res.status(400).send({ error: 'Erro ao trocar a senha tente novamente' })
    }
}
exports.resetPassword = async (req, res, next) => {
    const { password } = req.body;
    const { token } = req.params;

    const data = await authMidleware.decodeToken(token);

    const email = data.email;
    const tooken = data.token;

    try {

        const user = await userService.resetPassword({ email });
        if (!user)
            return res.status(400).send({ error: 'Usuário nao encontrado' });

        if (tooken !== user.passwordResetToken)
            return res.status(400).send({ error: 'Informações inválidas' })

        const now = new Date();
        if (now > user.passwordResetExpires)
            return res.status(400).send({ error: 'Validação expirada' })

        user.password = password;

        await userService.updatePassword(user);

        res.status(200).send({ date: now, message: ' Senha alterada com sucesso ' });

    } catch (error) {
        res.status(404).send({ error: 'Erro ao trocar a senha tente novamente' })
    }
}
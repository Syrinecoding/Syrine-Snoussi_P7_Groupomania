// imports
const bcrypt = require('bcrypt');
const jwtUtils = require('../utils/jwt.utils')
const models = require('../models');
// Verifier si dans model il faut indiquer id ?
let emailRegex = new RegExp ('^[a-zA-Z0-9.-_]+[@]{1}[a-zA-Z0-9.-_]+[.]{1}[a-z]{2,15}$', 'g');
let passwordRegex = new RegExp('/^[a-zA-Z]\w{3,14}$/');
// Routes
module.exports = {
    signup: function(req, res) {

        // Params
        const email = req.body.email;
        const username = req.body.username;
        const password = req.body.password;
        const bio = req.body.bio;
        // verifications (TODO : les regex à verifier !)
        if (email == null || username == null || password == null) {
            return res.status(400).json({'error': 'Paramètres manquants !'});
        }
        if (username.length >= 16 || username <= 4) {
            return res.status(400).json({
                'error': "mauvais nom d'utilisateur (le nombre de caractères doit être compris entre 3 et 15"
            })
        }
        if (!emailRegex.test(email)){
            return res.status(400).json({
                'error': "l'email n'est pas valide !"
            });
        }
        if (!passwordRegex.test(password)){
            return res.status(400).json({
                'error': "le mot de passe n'est pas valide (La première lettre doit être une lettre, entre 4 et 15 caractères, aucun caractère spécial) !"
            });
        }
        
        models.User.findOne({
            attributes: ['email'],
            where: { email: email}
        })
        .then(function(userFound) {
            if (!userFound) {
                bcrypt.hash(password, 5, function( err, bcryptPassword){
                    const newUser = models.User.create({
                        email: email,
                        username: username,
                        password: bcryptPassword,
                        bio: bio,
                        isAdmin: 0
                    })
                    .then(function(newUser){
                        return res.status(201).json({
                            'userId': newUser.id
                        })
                    })
                    .catch(function(err){
                        return res.status(500).json({ 'error': "Impossible d'ajouter l'utilisateur !"})
                    });
                });
            } else {
                return res.status(409).json({ 'error': "Cet utilisateur est déjà inscrit !"});
            }
        })
        .catch(function(err){
            return res.status(500).json({'error': "impossible de vérifier l'utilisateur !"});
        }); 
    },

    login: function(req, res) {
        // Params
        const email = req.body.email;
        const password = req.body.password;

        if(email == null || password == null) {
            return res.status(400).json({ 'error': 'paramètre manquant !' });
        }
        if (!emailRegex.test(email)){
            return res.status(400).json({
                'error': "l'email n'est pas valide !"
            });
        }
        if (password.length !== req.body.password.length) {
            return res.status(400).json({ 'error': 'vérifier la saisie'});
        }
        models.User.findOne({
            where: { email: email }
        })
        .then(function(userFound) {
            if(userFound){
                bcrypt.compare(password, userFound.password, function(errBycrypt, resByscrypt) {
                    if(resByscrypt) {
                        return res.status(200).json({
                            'userId': userFound.id,
                            'token': jwtUtils.generateToken(userFound)
                        });
                    } else {
                        return res.status(403).json({"error": "mot de passe invalide !"});
                    }
                });

            }else{
                return res.status(404).json({ 'error': "Cet utilisateur n'existe pas dans la base !" });
            }
        })
        .catch(function(err) {
            return res.status(500).json({ 'error': 'unable to verify user' });
        });
    }
}



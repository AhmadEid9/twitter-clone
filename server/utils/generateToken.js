import jwt from 'jsonwebtoken'
const generateToken = (id) => {
    const token = jwt.sign({ _id: id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    })

    return token
}

export default generateToken
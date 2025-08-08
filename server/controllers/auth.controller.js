const login = (req, res) => {
    res.json({
        data: 'you hit login endpoint' 
    })
}

const signin = (req, res) => {
    res.json({
        data: 'you hit signin endpoint' 
    })
}

export {
    login,
    signin
}
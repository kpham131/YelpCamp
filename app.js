const express = require('express')
const path = require('path')
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session')
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user')



const ExpressError = require('./utils/ExpressError')

const campgroundRoutes = require('./routes/campgrounds')
const reviewRoutes = require('./routes/reviews')
const userRoutes =require('./routes/user')

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

const sessionConfig = {
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie:{
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // for 1 week
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))


app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'))
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, 'public')))

// setting up passport
app.use(passport.initialize());
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()));
// store and unstore the user in the session
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use(flash());
app.use((req, res, next)=>{
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next()
})


const validateReview = (req, res, next)=>{
    const{error} = reviewSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    }
    else{
        next();
    }
}


// Connect to Mongo and setup
mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp', {
    useNewUrlParser: true,
    // useCreateIndex: true,
    useUnifiedTopology: true,
    // useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", ()=>{
    console.log("Database connected!")
})



// Routing
// home
app.get('/', (req,res)=>{
    res.render('home')
})

// Authentication stuff
app.get('/fakeUser', async(req, res)=>{
    const user = new User({email: 'k@gmail.com', username:'khoa'});
    const newUser = await User.register(user, 'chicken');
    res.send(newUser)
})
app.use('/', userRoutes)

// all
app.use("/campgrounds",campgroundRoutes)


// -------------Review-----------------
app.use('/campgrounds/:id/reviews', reviewRoutes)

app.all('*', (req, res,next)=>{
    next(new ExpressError('Page Not Found', 404))
})

// error handler
app.use((err, req, res, next)=>{
    const {statusCode =500} = err;
    if(!err.message)  err.message='Something went wrong!'
    res.status(statusCode).render('error', {err});
})

app.listen(3000, ()=>{
    console.log('Serving on port 3000')
})
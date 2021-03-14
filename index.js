//-------------------------------------------------------//
//--------------------- Basic setup ---------------------//
//-------------------------------------------------------//
//Import dependencies
var express = require('express');
var path = require('path');

//Setup body parser
const bodyParser = require('body-parser');

//Setup validator
const { check, validationResult } = require('express-validator');

//Setup file uploader
const fileUpload = require('express-fileupload');

//Get express-session
const session = require('express-session');

//--------------------- Database ---------------------//
//Setup DB connection
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/dogsbreedsblog', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

//Setup model for Admin
const Admin = mongoose.model('Admin', {
    username: String,
    password: String
});

//Setup model for Header
const Header = mongoose.model('Header', {
    tagLine: String,
    logoImgName: String
});

//Setup model for DogPage
const DogPage = mongoose.model('DogPage', {
    pageName: String,
    dogName: String,
    dogImgName: String,
    pageContent: String
});

//----------------- Global variables ------------------//
//Set up global variables
var myApp = express();
myApp.use(bodyParser.urlencoded({extended:false}));
myApp.use(session({
    secret: 'superrandomsecret', //fghdaifujeikjnc
    resave: false,
    saveUninitialized: true
}));
myApp.use(fileUpload());

//Set up path to Pubic folders and Views
myApp.set('views', path.join(__dirname, 'views'));

//Set up the path for public stuff like CSS, client side JS, images, ...
myApp.use(express.static(__dirname+'/public'));

//Define the view engine
myApp.set('view engine', 'ejs');

//-------------------------------------------------------//
//-------------------- Render Pages ---------------------//
//-------------------------------------------------------//
//Handle HTTP requests/ define routes of the website
myApp.get('/', function(req, res){

    //When there is no 'admin' login information (1st time running the web),
    //create a record and save it to DB
    Admin.findOne({}).exec(function(err, admin){
        console.log('Index admin error: ' + err);
        if (!admin)
        {
            var newAdmin = {
                username: "admin",
                password: "admin"
            }

            var newAdminObj = new Admin(newAdmin);
            newAdminObj.save();
        }
    });

    DogPage.find({}).exec(function(err, dogPages){
        console.log('Index error: ' + err);

        //Save list of dog pages to session for later use
        if (dogPages)
            req.session.dogPages = dogPages;

        Header.findOne({}).exec(function(err, header){
            console.log('Index header error: ' + err);

            //Save header to session for later use
            if (header)
                req.session.header = header;
            else
            {
                //When there is nothing in 'header' table (1st time running the web), 
                //create a new header and save to the DB
                var newHeader = {
                    tagLine: "Dogs Breeds blog",
                    logoImgName: "ILoveDogs-logo.png"
                }

                var newHeaderObj = new Header(newHeader);
                newHeaderObj.save();
                req.session.header = newHeader;
            }

            if (req.session.userLoggedIn)
            {
                res.render('index', {pageUrl: 'index', isLoggedIn: 'true', 
                            dogPages: dogPages, header: header});
            }
            else
            {
                res.render('index', {pageUrl: 'index', dogPages: dogPages, header: req.session.header});
            } 
        });
    });
});

myApp.get('/about', function(req, res){

    if (req.session.userLoggedIn)
    {
        res.render('about', {pageUrl: 'about', isLoggedIn: 'true', 
                dogPages: req.session.dogPages, header: req.session.header});
    }
    else
    {
        res.render('about', {pageUrl: 'about', dogPages: req.session.dogPages, 
                header: req.session.header});
    }
});

myApp.get('/contact', function(req, res){

    if (req.session.userLoggedIn)
    {
        res.render('contact', {pageUrl: 'contact', isLoggedIn: 'true', 
                dogPages: req.session.dogPages, header: req.session.header});    
    }
    else
    {
        res.render('contact', {pageUrl: 'contact', dogPages: req.session.dogPages, 
                header: req.session.header});
    }
});

myApp.get('/result', function(req, res){
    res.render('result', {pageCss: 'admin'});
});

myApp.get('/border-collie', function(req, res){

    if (req.session.userLoggedIn)
    {
        res.render('border-collie', {pageUrl: 'border-collie', isLoggedIn: 'true', 
                dogPages: req.session.dogPages, header: req.session.header});
    }
    else
    {
        res.render('border-collie', {pageUrl: 'border-collie', 
                dogPages: req.session.dogPages, header: req.session.header});
    }
});

myApp.get('/golden-retriever', function(req, res){

    if (req.session.userLoggedIn)
    {
        res.render('golden-retriever', {pageUrl: 'golden-retriever', isLoggedIn: 'true', 
                dogPages: req.session.dogPages, header: req.session.header});
    }
    else
    {
        res.render('golden-retriever', {pageUrl: 'golden-retriever', 
                dogPages: req.session.dogPages, header: req.session.header});
    }
});

//-------------------- Admin Pages ----------------------//
myApp.get('/login', function(req, res){
    res.render('login', {pageCss: 'admin', pageUrl: 'login', header: req.session.header});
});

myApp.get('/manage-pages', function(req, res){

    DogPage.find({}).exec(function(err, dogPages){
        console.log('Manage-pages error: ' + err);

        //Save list of dog pages to session for later use
        if (dogPages)
            req.session.dogPages = dogPages;

        Header.findOne({}).exec(function(err, header){
            console.log('Manage-pages header error: ' + err);

            //Save header to session for later use
            if (header)
                req.session.header = header;

            if (req.session.userLoggedIn)
            {
                res.render('manage-pages', {pageCss: 'admin', pageUrl: 'manage-pages', 
                        header: req.session.header, dogPages: req.session.dogPages});
            }
            else
            {
                res.redirect('/login');
            } 
        });
    });
});

myApp.get('/edit-header', function(req, res){
    //check if the user is logged in
    if (req.session.userLoggedIn)
    {
        res.render('edit-header', {pageCss: 'admin', pageUrl: 'edit-header', 
                header: req.session.header});
    }
    else
    {
        res.redirect('/login');
    }
});

myApp.get('/view-dog/:dogId', function(req, res){

    var id = req.params.dogId;
    DogPage.find({}).exec(function(err, dogPages){
        console.log('View-dog error: ' + err);

        if (dogPages)
        {
            for (var dogPage of dogPages)
            {
                if (dogPage._id.toString() == id)
                {
                    if (req.session.userLoggedIn)
                    {
                        res.render('view-dog', {pageUrl: dogPage.dogName, isLoggedIn: 'true', 
                                header: req.session.header, dogPages: dogPages, dogPage: dogPage});
                    }
                    else
                    {
                        res.render('view-dog', {pageUrl: dogPage.dogName, header: req.session.header, 
                                dogPages: dogPages, dogPage: dogPage});
                    }
                    break;
                }
            }
        }
    });
});

myApp.get('/edit-page/:dogId', function(req, res){
    //check if the user is logged in
    if (req.session.userLoggedIn)
    {
        var id = req.params.dogId;
        DogPage.findOne({_id: id}).exec(function(err, dogPage){
            if (dogPage)
            {
                res.render('edit-page', {pageCss: 'admin', addOn: 'tinymce', 
                        header: req.session.header, dogPage: dogPage});
            }
            else
            {
                //if user input an invalid id to the url, just send them the message, 
                //no any particular pages or css or anything...
                res.send('No page found with that id...');
            }
        });
    }
    else
    {
        res.redirect('/login');
    }
});

myApp.get('/add-page', function(req, res){
    //check if the user is logged in
    if (req.session.userLoggedIn)
    {
        res.render('add-page', {pageCss: 'admin', pageUrl: 'add-page', addOn: 'tinymce', 
                header: req.session.header});
    }
    else
    {
        res.redirect('/login');
    }
});

//dogId: url variable
myApp.get('/delete-page/:dogId', function(req, res){
    if(req.session.userLoggedIn) //check if the user is logged in
    {
        //delete
        var id = req.params.dogId; //id sent from the url
        console.log(id);

        //_id: field in the DB
        DogPage.findByIdAndDelete({_id: id}).exec(function(err, dogPage){
            console.log('Error: ' + err);
            //console.log('Page: ' + dogPage);

            if (dogPage) //if it found the order and can delete it, otherwise, it returns Null
            {
                res.render('delete-page', {pageCss: 'admin', header: req.session.header, 
                        message: 'You have successfully deleted the page!'});
            }
            else
            {
                res.render('delete-page', {pageCss: 'admin', header: req.session.header, 
                        message: 'Sorry, cannot find the page!'});
            }
        });
    }
    else
    {
        res.redirect('/login');
    }
});

myApp.get('/logout', function(req, res){
    req.session.username = '';
    req.session.userLoggedIn = false;

    res.render('index', {pageUrl: 'index', header: req.session.header, 
            dogPages: req.session.dogPages});
});

//-------------------------------------------------------//
//----------------- Forms processing --------------------//
//-------------------------------------------------------//
myApp.post('/login', [
    check('uname', 'Username is required!').not().isEmpty(),
    check('pass', 'Password is required!').not().isEmpty()
], function(req, res){

    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        res.render('login', { pageCss: 'admin', pageUrl: 'login', 
                header: req.session.header, errors: errors.array()});
    }
    else
    {
        var uname = req.body.uname;
        var pass = req.body.pass;

        Admin.findOne({username: uname, password: pass}).exec(function(err, admin){
            console.log('Login error: ' + err);

            if (admin)
            {
                //store username in session and set logged in status to true
                req.session.username = admin.username;
                req.session.userLoggedIn = true;

                //redirect to the admin's dashboard
                res.redirect('/manage-pages');
            }
            else
            {
                res.render('login', {pageCss: 'admin', pageUrl: 'login', header: req.session.header,
                                    error: 'Please check again username and/or password!'});
            }
        });
    }
});

myApp.post('/edit-header', [
    check('tagline', 'Tagline is required!').not().isEmpty()
], function(req, res){

    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        Header.findOne({}).exec(function(err, header){
            res.render('edit-header', {pageCss: 'admin', pageUrl: 'edit-header', 
                    header: req.session.header, errors: errors.array()});
        });
    }
    else
    {
        var tagline = (req.body.tagline).trim();

        Header.findOne({}).exec(function(err, header){

            header.tagLine = (req.body.tagline).trim();
            //backup the current logo
            var oldLogoImgName = header.logoImgName;

            if (req.files != null) //user input a new logo
            {
                var logoImg = req.files.logoImg; //get actual file uploaded
                var logoImgName = req.files.logoImg.name; //get name of file uploaded
                var logoImgPath = 'public/images/' + logoImgName; //create path for the file
                logoImg.mv(logoImgPath, function(err){ //move file from temp folder (on server) to images
                    console.log(err);
                });

                header.logoImgName = logoImgName;
            }
            else //user does not choose a new logo
            {
                header.logoImgName = oldLogoImgName;
            }

            header.save();

            //store header in session for later use
            req.session.header = header;

            res.render('edit-header', {pageCss: 'admin', pageUrl: 'edit-header', 
                    result: 'success', header: header});
        });
    }
});

function checkRequiredImage(value, {req}){
    if (req.files != null)
        return true;
    return false;
}

myApp.post('/add-page', [
    check('pageTitle', 'Name is required!').not().isEmpty(),
    check('dogImg', 'Image is required and should be valid (.jpg, jpeg, .gif, .png)!').custom(checkRequiredImage),
    check('pageContent', 'Content is required!').not().isEmpty()
], function(req, res){

    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        console.log('Add-page error:' + errors);
        res.render('add-page', {pageCss: 'admin', pageUrl: 'edit-header', 
                addOn: 'tinymce', header: req.session.header, errors: errors.array()});
    }
    else
    {
        //get dogName from input field, remove the spaces before and after the input
        //i.e: "  Border Collie  " -> "Border Collie"
        var dogName = (req.body.pageTitle).trim();
        //create a page name from the dogName, i.e: "Border Collie" -> "border-collie"
        var pageName = dogName.toLowerCase().replace(/ /g, '-');
        var dogImg = req.files.dogImg; //actual image
        var dogImgName = req.files.dogImg.name; //image name
        var dogImgPath = 'public/images/' + dogImgName; //create path for the file
        var pageContent = req.body.pageContent;
        dogImg.mv(dogImgPath, function(err){ //move file from temp folder (on server) to images
            console.log('Add-page move file error: ' + err);
        });

        //prepare data for output/saving
        var newDogPage = {
            pageName: pageName,
            dogName: dogName,
            dogImgName: dogImgName,
            pageContent: pageContent
        }

        //save to DB
        var newDogObj = new DogPage(newDogPage);
        newDogObj.save().then(function(){
            res.render('result', {pageCss: 'admin', header: req.session.header,
                message: 'You have successfully created the new page, please go to Homepage to see it!'});
        });
    }
});

//dogId: url variable
myApp.post('/edit-page/:dogId', [
        check('pageTitle', 'Name is required!').not().isEmpty(),
        check('pageContent', 'Content is required!').not().isEmpty()
], function(req, res){
    
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        var id = req.params.dogId;
        DogPage.findOne({_id: id}).exec(function(err, dogPage){
            console.log('Edit-page error: ' + err);

            if (dogPage)
            {
                res.render('edit-page', {pageCss: 'admin', pageUrl: 'manage-pages', addOn: 'tinymce', 
                        header: req.session.header, dogPage: dogPage, errors: errors.array()});
            }
            else
            {
                //if user input an invalid id to the url, just send them the message, 
                //no any particular pages or css or anything...
                res.send('No page found with that id...');
            }
        });
    }
    else
    {
        var id = req.params.dogId;
        DogPage.findOne({_id: id}, function(err, dogPage){

            //get dogName from input field, remove the spaces before and after the input
            //i.e: "  Border Collie  " -> "Border Collie"
            dogPage.dogName = (req.body.pageTitle).trim();
            dogPage.pageContent = req.body.pageContent;
            //backup current dog image
            var oldDogImgName = dogPage.dogImgName;

            if (req.files != null) //user upload a new image
            {
                var dogImg = req.files.dogImg; //actual image
                var dogImgName = req.files.dogImg.name; //image name
                var dogImgPath = 'public/images/' + dogImgName; //create path for the file
                dogImg.mv(dogImgPath, function(err){ //move file from temp folder (on server) to images
                    console.log('Edit-page move file error: ' + err);
                });
                
                dogPage.dogImgName = dogImgName;
            }
            else //user does not upload new image
            {
                dogPage.dogImgName = oldDogImgName;
            }

            dogPage.save();
        });

        res.render('result', {pageCss: 'admin', header: req.session.header,
                message: 'You have successfully edited the page, please go to Homepage to view it!'});
    }
});

//----------------- Start the server --------------------//
myApp.listen(8080);
console.log('Everything is fine.. website at port 8080...');


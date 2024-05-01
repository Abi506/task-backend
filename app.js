const express=require('express');
const app=express()
app.use(express.json())

const sqlite3=require('sqlite3')
const {open}=require('sqlite')

const cors=require('cors')

const jwt=require('jsonwebtoken')
const bcrypt=require('bcrypt')

app.use(cors())

let data=null;
const path=require('path')
const dbpath=path.join(__dirname,"task.db")
const initializaDatabaseAndServer=async()=>{

 try{
    data=await open({
        filename:dbpath,
        driver:sqlite3.Database,
    })
    
    app.listen(3000,()=>{
        console.log(`Server is running on the local host ${3000}`)
    })
 }
 catch(error){
    console.log(`Data base Error ${error.message}`)
    process.exit()
 }
    
}
initializaDatabaseAndServer()


//login api

app.post("/login/", async (request, response) => {
    const { username, password_hash } = request.body;
    //console.log(username, "username");
    const isUserExistsQuery = `
      SELECT * FROM users 
      WHERE username='${username}'
      `;
    const dbUser = await data.get(isUserExistsQuery);
    //console.log(dbUser, "dbuserdfndfdnfkjgdfkjndkfgnkdfnjkndf");
    if (dbUser === undefined) {
      //user not exists
      response.status(400);
      response.send({ error_msg: "Invalid User" });
    } else {
      //user exists
      const isPasswordMatched = await bcrypt.compare(password_hash, dbUser.password_hash);
      //console.log(password_hash, "here", dbUser.password, "userExists");
      //console.log(isPasswordMatched, "passwordMatched");
      if (isPasswordMatched === true) {
        //password is correct
        const payload = { username: username };
        const jwtToken = jwt.sign(payload, "my_token");
        response.send({ jwtToken });
      } else {
        //invalid password
        response.status(400);
        response.send({error_msg:"Invalid Password"});
      }
    }
  });

  const authentication = (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers['authorization'];
    if (authHeader !== undefined) {
        jwtToken = authHeader.split(" ")[1];
        jwt.verify(jwtToken, 'my_token', async (error, payload) => {
            console.log(payload, 'payload')
            if (error) {
                response.status(401);
                response.send("Invalid jwt Token");
            } else {
                console.log('here the jwt token is there');
                request.username = payload.username;
                console.log(request.username, 'username from payload');
                next();
            }
        });
    } else {
        console.log("token not there");
        response.status(401);
        response.send("Invalid jwt Token");
    }
}

//user details list

app.get("/",authentication,async(request,response)=>{
    console.log('you have revied it')
    const getUserQuery=`
    SELECT * FROM users
    `;
    const usersArr=await data.all(getUserQuery)
    console.log(usersArr,'here')
    response.status(200).json({message:'ok',users:usersArr})
    
})

//create new user

app.post('/new-user',async(request,response)=>{
    const {username,password_hash}=request.body
    console.log(username,password_hash,'username password here')

    const isUserNameAvaiable=`
    SELECT * FROM users
    where username='${username}'
    `
    const isUserNameAvaiableArr=await data.get(isUserNameAvaiable);
    console.log(isUserNameAvaiableArr,'checks wether the username is available or not')

    if(isUserNameAvaiableArr === undefined){
        //username not exist create account

        const hashedPassword=await bcrypt.hash(password_hash,10);
        const newUserQuery=`
        INSERT INTO users(username,password_hash)
        values
        (
        '${username}' ,
            '${hashedPassword}'
        )
        `
        const newUser=await data.run(newUserQuery);
        console.log("user created successfully")
    
        response.send("user created Successfulyy")
        
    }
    else{
        //username already exist
        response.status(400);
        response.send("Username Already Exist");
    }

    
})

//delete user
app.delete("/delete-user",authentication,async(request,response)=>{
    const username=request.username;
    console.log(username,'username in deletion')
    const delteUserQuery=`
    delete from users
    where username='${username}'
    `
    try {
        await data.run(delteUserQuery);
        response.send('User Deleted Successfully');
    } catch (error) {
        console.error('Error deleting user:', error.message);
        response.status(500).send('Error deleting user');
    }
})

// create a new task 

//const newTaskQuery=`
//INSERT INTO Tasks(title,descriptiom,status,assignee_id)
//`

app.post('/tasks',authentication,async(request,response)=>{
    const {title,description,status}=request.body;
    const username=request.username

    const findingUserIdQuery=`
    SELECT * FROM users
    where username='${username}'
    `
    const findingUserArr=await data.get(findingUserIdQuery);
    console.log(findingUserArr,'userdata goes here')
    const user_id=findingUserArr.id
    console.log(user_id,'user id')

    const currentDataAndTime=new Date().toLocaleString();
    console.log(currentDataAndTime,'current date and time')
    console.log(title,description,status,'here the data');
    const newTaskQuery=`
    INSERT INTO Tasks(title,description,status,assignee_id,created_at)
    values
    (
        '${title}',
        '${description}',
        '${status}',
        '${user_id}',
        '${currentDataAndTime}'

    );
    `
    const newTaskArr=await data.run(newTaskQuery);
    console.log(newTaskArr,'new task array');
    response.send("Task created successfully");
    
})


//displaying all the tasks
app.get('/tasks',async(request,response)=>{
    
    const getTaskQuery=`
    SELECT * FROM Tasks
    `
    const getTaskArr=await data.all(getTaskQuery);
    console.log(getTaskArr,'get task arr');
    response.send(getTaskArr)
})

//updating the tasks by task id

app.put('/tasks/:id',async(request,response)=>{
    const {id}=request.params;
    const{status}=request.body
    console.log(id,'id')
    const currentDataAndTime=new Date().toLocaleString();
    console.log(currentDataAndTime,'current date and time')
console.log(status,'status')
    const updateTaskQuery=`
    Update Tasks
    SET status='${status}',updated_at='${currentDataAndTime}'
    where id=${id}
    `
    const updateTaskArr=await data.run(updateTaskQuery)
    response.send("Task Updated")

})


//update the task based on the id
app.delete("/tasks/:id",authentication,async(request,response)=>{
    const username=request.username;
    console.log(username,'username in deletion')
    const delteUserQuery=`
    delete from users
    where username='${username}'
    `
    try {
        await data.run(delteUserQuery);
        response.send('User Deleted Successfully');
    } catch (error) {
        console.error('Error deleting user:', error.message);
        response.status(500).send('Error deleting user');
    }
})
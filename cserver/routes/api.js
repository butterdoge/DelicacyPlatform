const mysql = require("mysql");
const config = require("../config");
//导入mysql和配置

//引入express模块
var express = require("express");
const jwt = require("jsonwebtoken");
const moment = require("moment");
//制造一个路由组件
var router = express.Router();
router.use(express.json());
// router.use(formidable())

router.use(express.urlencoded({ extended: true }));



router.get("/profile",function(req,res,next){
  const authorization=req.headers.authorization;
  if(authorization===''){
    console.log('该用户不含有请求头，请求无效。')
    res.status(401).send();
  }
  const token=authorization.split(' ')[1];
  console.log(`authorization的信息为${token}`);
  // 合法性验证
  try{
    tokenContent=jwt.verify(token,'iwisscotmail');
    console.log(`解析后的token为:`);
    console.log(tokenContent)
    res.status(200).json(tokenContent);
  }catch(err){
    console.log(err);
    console.log('token解析异常')
    // res.status(400).send();
    // 好像只要出现err就会出现500请求码，不可以再设置status了。
    throw(err);
  }
  console.log("ok!")
  
})


// 登入部分。在这一部分进行登入和token的发放。
router.post("/login", function (req, res, next) {
  var connection = mysql.createConnection(config.options);
  connection.connect(function (err) {
    console.log("数据库连接成功！");
  });
  var account=req.body.account;
  var password=req.body.password;
  console.log(req.body);
  console.log(`用户输入的账户为${req.body.account}，输入的密码为${req.body.password}`)
  connection.query(
    "select * from users where account=? ",
    [account],
    function (error, results) {
      if (error) throw error;
      console.log('数据库读取结果为');
      console.log(results);
      //这里注意，数据库返回的是行数据results是数组形式
      if (results.length == 0) {
        console.log("没有查到该账户！");
        return res.status(402).json({
          errorType: 1,
        });
      }

      console.log(`查到的结果${results[0].password}`);
      console.log(`输入密码为${password}`)
      console.log(`输入密码类型为${typeof password}`)
      console.log(`数据库密码类型为${typeof results[0].password}`)
      if (results[0].password == password) {
        var token = jwt.sign({
          clientName: results[0].clientName,
          clientType: results[0].clientType,
          account:results[0].account,
          userImage:results[0].userImage
        },"iwisscotmail",{
          expiresIn:'3000s'
        });
        console.log("身份验证匹配");
        console.log(`送出的token为${token}`);
        var tokenSended={"token":token}
        return res.status(233).json(tokenSended);
      }
      else{
        console.log(`身份验证不匹配`)
        return res.status(402).json({
          errorType:2,
        })
      }
    }
  );
  connection.end();
});


// 无用api
router.post("/insert", function (req, res, next) {
  var connection = mysql.createConnection(config.options);
  connection.connect(function (err) {
    console.log("数据库连接成功！");
  });
  var payload = req.body;
  console.log(payload);
  // var name=payload.name;
  // var roadmap=payload.roadmap;
  var city = payload.city;
  var school = payload.school;
  var name = payload.name;
  var score = payload.score;
  var time = payload.time;
  var amount = payload.amount;
  var contact = payload.contact;
  connection.query(
    "insert into quiz(score,userName,userTime,city,school,amount,contact) values(?,?,?,?,?,?,?)",
    [score, name, time, city, school, amount, contact],
    function (error, results, fields) {
      if (error) throw error;
      console.log(results);
      console.log(fields);
      res.json(results);
    }
  );
  //接下来插入到另一个数据库。
  // var roads=roadmap.split('>');
  // console.log(roads);
  // var query2="insert into bus2(Stopp,Route,Position) values(?,?,?)"
  // for(let i=0;i<roads.length;i++){
  //   connection.query(query2,[roads[i],name,i+1],function(error,results,fields){
  //     if (error) throw error;
  //     // res.json(results)
  //   })
  connection.end();
  // res.json(req.body);
  // req.end();
});

// 无用api
router.delete("/delete", function (req, res, next) {
  var id = req.query.id;
  console.log(`删除id为${id}`);
  var sql = "delete from bus where id=?";
  var connection = mysql.createConnection(config.options);
  connection.connect(function (err) {
    console.log("数据库连接成功！");
  });
  connection.query(sql, [id], function (err, result) {
    if (err) throw error;
    res.send("删除成功");
  });
  connection.end();
});


// 获得团体名的api
router.get("/getUnites",function(req,res,next){
  var connection = mysql.createConnection(config.options);
  sql="select distinct name,unitID,unitDes from unit";
  connection.query(sql, [], function (err, results) {
    if (err) throw error;
    console.log('向客户发送了一个团体的列表')
    console.log(results);
    res.json(results);
  });
  connection.end();
})

// 创造新用户的api
router.post("/createNewUser",function(req,res,next){
  var payload = req.body;
  var connection = mysql.createConnection(config.options);
  sql="INSERT INTO users (username,password,unitID,authority,description) VALUES (?,?,?,?,?) ";
  connection.query(sql, [payload.username,payload.password,payload.unitID,payload.authority,payload.description], function (err, results) {
    if (err) throw err;
    console.log('成功执行一条插入新用户操作，信息如下：')
    console.log(results);
    // 之后再写一个返回用户账号名的查询，现在先懒着。
    res.json(results);
  });
  connection.end();
})


// 更新用户记录的api
router.post("/updateUser",function(req,res,next){
  var user=req.body;
  var connection = mysql.createConnection(config.options);
  sql="update users set username= ?,password=?,unitID=?,description=?,authority=? where uuid=?;"
  connection.query(sql, [user.username,user.password,user.unitID,user.description,user.authority,user.uuid], function (err, results) {
    if (err) throw error;
    console.log('执行修改数据查询，修改结果如下:');
    console.log(results);
    res.json(results);
  });
  connection.end();
})
//导出router。

// 获取各个部门人数的比例
router.get("/numsData",function(req,res,next){
  var connection=mysql.createConnection(config.options);
  sql="SELECT unit.unitID,name,count(uuid) AS nums FROM users,unit where users.unitID=unit.unitID GROUP BY users.unitID;"
  connection.query(sql,[],function(err,results){
    if(err)throw error;
    res.json(results);
  })
  connection.end();
})

// 获取不同管理级别的人数
router.get("/authorData",function(req,res,next){
  var connection=mysql.createConnection(config.options);
  sql="SELECT authority,count(uuid) AS nums FROM users,unit where users.unitID=unit.unitID GROUP BY users.authority;"
  connection.query(sql,[],function(err,results){
    if(err)throw error;
    res.json(results);
  })
})


//新的作业的代码：
router.get("/getFoods",function(req,res,next){
  var connection = mysql.createConnection(config.options);
  var foodtype=req.query.type;
  if(foodtype){
    sql="select * from foods where foodType=?";
    connection.query(sql, [foodtype], function (err, results) {
      console.log(err);
      if (err) throw error;
      console.log('向客户发送了一个foods的列表')
      console.log(results);
      res.json(results);
    });
    connection.end();
  }
  else{
    sql="select * from foods";
    connection.query(sql, [], function (err, results) {
      console.log(err);
      if (err) throw error;
      console.log('向客户发送了一个foods的列表')
      console.log(results);
      res.json(results);
    });
    connection.end();
  }
})

router.get("/getDeals",function(req,res,next){
  var userID=req.query.userID;
  if(!userID){
    var connection = mysql.createConnection(config.options);
    sql="select * from deals D,foods F,dealers E,users U where D.foodID=F.foodID and F.dealerId=E.dealerId and U.account=D.guestID";
    connection.query(sql, [], function (err, results) {
      console.log(err);
      if (err) throw error;
      console.log('向客户发送了一个deals的列表')
      console.log(results);
      res.json(results);
    });
    connection.end();
  }
  else{
    var connection = mysql.createConnection(config.options);
    sql="select * from deals D,foods F,dealers E where guestID=? and D.foodID=F.foodID and F.dealerId=E.dealerId";
    connection.query(sql, [userID], function (err, results) {
      console.log(err);
      if (err) throw error;
      console.log('向客户发送了一个指定deals的列表')
      console.log(results);
      res.json(results);
    });
    connection.end();
  }
})

router.get("/getUsers",function(req,res,next){
  var connection = mysql.createConnection(config.options);
  sql="select * from users";
  connection.query(sql, [], function (err, results) {
    console.log(err);
    if (err) throw error;
    console.log('向客户发送了一个users的列表')
    console.log(results);
    res.json(results);
  });
  connection.end();
})

router.get("/getCarlist",function(req,res,next){
  var userID=req.query.id;
  var connection = mysql.createConnection(config.options);
  sql="select * from caritem C,foods F where clientId = ? and C.foodID=F.foodID";
  connection.query(sql, [userID], function (err, results) {
    console.log(err);
    if (err) throw error;
    console.log('向客户发送了一个指定用户的购物车的列表')
    console.log(results);
    res.json(results);
  });
  connection.end();
})

router.get("/getTexts",function(req,res,next){
  var connection = mysql.createConnection(config.options);
  sql="select * from texts,dealers,users where texts.guestID=users.account and texts.dealerID=dealers.dealerID";
  connection.query(sql, [], function (err, results) {
    console.log(err);
    if (err) throw error;
    console.log('请求获得所有评论')
    console.log(results);
    res.json(results);
  });
  connection.end();
})


router.post("/createAccount",function(req,res,next){
  var user=req.body;
  var connection = mysql.createConnection(config.options);
  sql="INSERT INTO users (clientName,clientType,account,password,userImage) VALUES (?,?,?,?,?)";
  connection.query(sql, [user.clientName,user.clientType,user.account,user.password,user.imgurl], function (err, results) {
    if (err) {
      console.log(err);
      throw error;
    }
    console.log('插入了一条用户信息');
    console.log(results);
    res.json(results);
  });
  connection.end();
})

router.post("/createFood",function(req,res,next){
  var food=req.body;
  var moment = require('moment')
  var ts = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
  var connection = mysql.createConnection(config.options);
  sql="INSERT INTO foods (foodType,timestamp,foodInfo,expireFlag,price,dealerId,imgUrl,foodTitle) VALUES (?,?,?,?,?,?,?,?)";
  connection.query(sql, [food.foodType,ts,food.foodInfo,food.expireFlag,food.price,food.dealerId,food.imgUrl,food.foodTitle], function (err, results) {
    if (err) {
      console.log(err);
      throw error;
    }
    console.log('创建了一条食物信息');
    console.log(results);
    res.json(results);
  });
  connection.end();
})

router.post("/setAdmin",function(req,res,next){
  var payloid=req.body;
  var connection = mysql.createConnection(config.options);
  sql="UPDATE users SET clientType=? where account = ?";
  connection.query(sql, [payloid.Admin,payloid.account], function (err, results) {
    if (err) {
      console.log(err);
      throw error;
    }
    console.log('插入了一条用户信息');
    console.log(results);
    res.json(results);
  });
  connection.end();
})

router.post("/createText",function(req,res,next){
  var text=req.body;
  var connection = mysql.createConnection(config.options);
  sql="INSERT INTO texts (textType,textInfo,dealerID,guestID) values (?,?,?,?)";
  connection.query(sql, [text.textType,text.textInfo,text.dealerID,text.guestID], function (err, results) {
    if (err) {
      console.log(err);
      throw error;
    }
    console.log('创造一条信息请求');
    console.log(results);
    res.json(results);
  });
  connection.end();
})

router.post("/changeDealState",function(req,res,next){
  var payloid=req.body;
  var connection = mysql.createConnection(config.options);
  sql="UPDATE deals SET statue=? where dealID = ?"
  connection.query(sql, [payloid.State,payloid.dealID], function (err, results) {
    if (err) {
      console.log(err);
      // throw error;
    }
    console.log('修改了一条订单信息。');
    console.log(results);
    res.json(results);
  });
  connection.end();
})

router.delete("/deleteFood",function(req,res){
  var id=req.query.id;
  var connection=mysql.createConnection(config.options);
  sql="Delete from foods where foodID=?";
  connection.query(sql,[id],function(err,results){
    if(err){
      console.log(err);
    }
    console.log("删除了一个食物。");
    console.log(results);
    res.json(results);
  })
  connection.end();
})

router.get("/getShops",function(req,res,next){
  var connection = mysql.createConnection(config.options);
  sql="select * from dealers";
  connection.query(sql, [], function (err, results) {
    console.log(err);
    if (err) throw error;
    console.log('向客户发送了一个商家信息的列表')
    console.log(results);
    res.json(results);
  });
  connection.end();
})

router.post("/addCarItem",function(req,res,next){
  var connection=mysql.createConnection(config.options);
  var payload=req.body;
  var ts = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
  sql="INSERT INTO caritem (foodID,amount,clientID,addedTime,totalPrice) values (?,?,?,?,?)"
  connection.query(sql,[payload.foodID,1,payload.clientID,ts,payload.totalPrice],function(err,results){
    if(err){
      console.log(err);
    }
    res.json(results);
  })
})

router.post("/addDeal",function(req,res,next){
  var connection=mysql.createConnection(config.options);
  var payload=req.body;
  console.log(req.body);
  sql="INSERT INTO deals (foodID,statue,amount,totalPrice,guestID) values (?,?,?,?,?)"
  connection.query(sql,[payload.foodID,"交易中",1,payload.totalPrice,payload.guestID],function(err,results){
    if(err){
      console.log(err);
    }
    res.json(results);
  })
})
module.exports = router;

const express = require("express");
const app = express();
const mongoose = require("mongoose");

const fileupload = require("express-fileupload");
app.use(fileupload());
app.use(express.static("public"));
app.use(express.json());
const cors = require("cors");
app.use(cors());
const bcrypt = require("bcryptjs");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));

const jwt = require("jsonwebtoken");
var nodemailer = require("nodemailer");

const JWT_SECRET =
  "hvdvay6ert72839289()aiyg8t87qt72393293883uhefiuh78ttq3ifi78272jbkj?[]]pou89ywe";

/*const mongoUrl =
  "mongodb+srv://adarsh:adarsh@cluster0.zllye.mongodb.net/?retryWrites=true&w=majority";
 */
const mongoUrl =
  "mongodb+srv://mcplustexturepack:6BV8j5QJWAxy5va@cluster0.528peek.mongodb.net/?retryWrites=true&w=majority";

mongoose
  .connect(mongoUrl, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("Connected to database");
  })
  .catch((e) => console.log(e));

require("./userDetails");
require("./teamDetails");
require("./teamMembers");
require("./sportsDetails");
require("./imageDetails");
require("./userFriends");
require("./eventDetails");
require("./userEvents");

const User = mongoose.model("UserInfo");
const Team = mongoose.model("TeamInfo");
const TeamMembers = mongoose.model("TeamMembers");
const Sports = mongoose.model("SportsTypes");
const Images = mongoose.model("ImageDetails");
const UserFriends = mongoose.model("UserFriends");
const Event = mongoose.model("EventDetails");
const UserEvents = mongoose.model("UserEvents");

app.post("/register", async (req, res) => {                               // done
  let { fname, lname, email, password, userType } = req.body;
  email = email.toLowerCase();

  const encryptedPassword = await bcrypt.hash(password, 10);
  try {
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.json({ error: "User already Exists" });
    }

    const profilePics = ['http://127.0.0.1:5000/footballer1.jpg', 'http://127.0.0.1:5000/footballer2.jpg', 'http://127.0.0.1:5000/footballer3.jpg', 'http://127.0.0.1:5000/footballer4.jpg']
    const randomProfilePic = profilePics[Math.floor(Math.random() * profilePics.length)];

    await User.create({
      fname,
      lname,
      email,
      password: encryptedPassword,
      userType,
      position: 'Not Set Position',
      description: 'Hey there! Welcome to my profile.',
      profilePic: randomProfilePic,
      profileBanner: randomProfilePic,
    });
    const token = jwt.sign({ email: email }, JWT_SECRET, {
      expiresIn: "4h",
    });

    return res.json({ status: "ok", data: token });
  } catch (error) {
    res.send({ status: "error" });
  }
});

app.post("/login-user", async (req, res) => {                           // done
  let { email, password } = req.body;
  email = email.toLowerCase();

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ error: "User Not found" });
  }
  if (await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ email: user.email }, JWT_SECRET, {
      expiresIn: "4h",
    });

    if (res.status(201)) {
      return res.json({ status: "ok", data: token });
    } else {
      return res.json({ error: "error" });
    }
  }
  res.json({ status: "error", error: "Invalid Password" });
});

app.post("/updateProfile", async (req, res) => {                            // done
  let { token, fname, lname, email, profilePic } = req.body;

  const user = jwt.verify(token, JWT_SECRET, (err, res) => {
    if (err) {
      return "token expired";
    }
    return res;
  });
  if (user == "token expired") {
    return res.send({ status: "error", data: "token expired" });
  }
  const userEmail = user.email;

  User.findOne({ email: userEmail })
    .then((data) => {
      const userId = data._id;

      // If a value is not provided, then the value will be set to the previous value
      if (fname == "") {
        fname = data.fname;
      }
      if (lname == "") {
        lname = data.lname;
      }
      if (profilePic == "") {
        profilePic = data.profilePic;
      }

      User.updateOne(
        { _id: userId },
        {
          $set: {
            fname: fname,
            lname: lname,
            email: email,
            profilePic: profilePic,
          },
        }
      )
        .then((data) => {
          res.send({ status: "ok", data: "Successfully Updated Profile" });
        })
        .catch((err) => {
          res.send({ status: "error", data: err });
        });
    })
    .catch((err) => {
      res.send({ status: "error", data: err });
    });
});

app.post("/changePassword", async (req, res) => {                     // done
  let { token, oldPassword, newPassword } = req.body;

  const user = jwt.verify(token, JWT_SECRET, (err, res) => {
    if (err) {
      return "token expired";
    }
    return res;
  });
  if (user == "token expired") {
    return res.send({ status: "error", data: "token expired" });
  }
  const userEmail = user.email;

  User.findOne({ email: userEmail })
    .then(async (data) => {
      const userId = data._id;
      
      if (await bcrypt.compare(oldPassword, data.password)) {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        User.updateOne(
          { _id: userId },
          {
            $set: {
              password: encryptedPassword,
            },
          }
        )
          .then((data) => {
            res.send({ status: "ok", data: "Successfully Updated Password" });
          })
          .catch((err) => {
            res.send({ status: "error", data: err });
          });
      } else {
        res.send({ status: "error", data: "Invalid Password" });
      }
    })
    .catch((err) => {
      res.send({ status: "error", data: err });
    });
});

app.post("/joinTeam/:teamId/:inviteCode", async (req, res) => {
  const { teamId, inviteCode } = req.params;
  const { token } = req.body;

  const teamObj = await Team.findOne({ _id: teamId });
  if (!teamObj) {
    return res.json({ status: "Team does not Exists!" });
  }

  // Check if the teams invite code matches with the invite code entered by the user
  if (teamObj.inviteCode !== inviteCode) {
    return res.json({ status: "Invalid Invite Code!" });
  }

  try {
    // Get the user email from the token
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }
    const userEmail = user.email;

    // Get the user id from the user email
    User.findOne({ email: userEmail })
      .then((data) => {
        const userId = data._id;
        
        // Check if the user is already a member of the team
        TeamMembers.findOne({ user: userId, team: teamId })
          .then((data) => {
            if (data) {
              res.send({ status: "error", data: "You are already a member of the team!" });
            } else {
              // Add the user to the team
              TeamMembers.create({
                team: teamId,
                user: userId,
                position: 'Not Set Position',
                description: 'Not Set Description',
                role: 'Member'
              });
              res.send({ status: "ok", data: "Successfully Added to the team" });
            }
          })
          .catch((error) => {
            console.log(error);
          });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      }
    );
  } catch (error) {
    console.log(error);
    res.send({ status: "error", data: error });
  }
});

app.post("/sendFriendRequest", async (req, res) => {              // done
  const { token, friendId } = req.body;

  try {
    // Get the user email from the token
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }
    const userEmail = user.email;
    
    // Get the user id from the user email
    User.findOne({ email: userEmail })
      .then((data) => {
        const userId = data._id;

        // Check if the user is already a friend of the user
        UserFriends.findOne({ user: userId, friend: friendId })
          .then((data) => {
            if (data) {
              if(data.status === 'Pending'){
                return res.send({ status: "error", data: "You have already sent a friend request to this user!" });
              }
              else if(data.status === 'Accepted') {
                res.send({ status: "error", data: "You are already friends with this user!" });
              }
            } else {
              // Create the friend with the status Pending
              UserFriends.create({
                user: userId,
                friend: friendId,
                status: 'Pending',
              });
              res.send({ status: "ok", data: "Successfully sent friend request" });
            }
          })
          .catch((error) => {
            console.log(error);
          });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      }
    );
  } catch (error) {
    console.log(error);
    res.send({ status: "error", data: error });
  }
});

app.post("/acceptFriendRequest", async (req, res) => {                // done
  const { token, friendId } = req.body;

  try {
    // Get the user email from the token
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }
    const userEmail = user.email;

    // Get the user id from the user email
    User.findOne({ email: userEmail })
      .then((data) => {
        const userId = data._id;

        // Get the friend request from the user
        UserFriends.findOne({ user: friendId, friend: userId })
          .then((data) => {
            if (data) {
              // Update the friend status to Accepted
              UserFriends.updateOne({ user: friendId, friend: userId }, { status: 'Accepted' })
                .then((data) => {
                  UserFriends.create({
                    user: userId,
                    friend: friendId,
                    status: 'Accepted',
                  });
                  res.send({ status: "ok", data: "Successfully accepted friend request" });
                })
                .catch((error) => {
                  console.log(error);
                });
            } else {
              res.send({ status: "error", data: "You need to send a Friend Request first!" });
            }
          })
          .catch((error) => { 
            console.log(error);
          });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      }
    );
  } catch (error) {
    console.log(error);
    res.send({ status: "error", data: error });
  }
});

app.post("/rejectFriendRequest", async (req, res) => {              // done
  const { token, friendId } = req.body;

  try {
    // Get the user email from the token
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }
    const userEmail = user.email;

    // Get the user id from the user email
    User.findOne({ email: userEmail })
      .then((data) => {
        const userId = data._id;

        // Get the friend request from the user
        UserFriends.findOne({ user: friendId, friend: userId })
          .then((data) => {
            if (data) {
              // Delete the friend request
              UserFriends.deleteOne({ user: friendId, friend: userId })
                .then((data) => {
                  res.send({ status: "ok", data: "Successfully rejected friend request" });
                })
                .catch((error) => {
                  console.log(error);
                });

            } else {
              res.send({ status: "error", data: "You need to send a Friend Request first!" });
            }
          })
          .catch((error) => { 
            console.log(error);
          });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      }
    );
  } catch (error) {
    console.log(error);
    res.send({ status: "error", data: error });
  }
});

app.post("/getFriendStatus", async (req, res) => {
  const { token, friendId } = req.body;

  try {
    // Get the user email from the token
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }
    const userEmail = user.email;

    // Get the user id from the user email
    User.findOne({ email: userEmail })
      .then((data) => {
        const userId = data._id;

        let foundStatus = false;
        let status = "";

        // Get the friend request from the friend
        UserFriends.findOne({ user: friendId, friend: userId })
          .then((data) => {
            if (data) {
              foundStatus = true;
              status = data.status;
            }

            // Get the friend request from the user
            UserFriends.findOne({ user: userId, friend: friendId })
            .then((data) => {
              if (data) {
                foundStatus = true;
                status = data.status;
              }

              if (foundStatus) {
                res.send({ status: "ok", data: status });
              }
              else {
                res.send({ status: "ok", data: "No friend request found" });
              }
            })
            .catch((error) => {
              console.log(error);
            }
          );

          })
          .catch((error) => {
            console.log(error);
          });

      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      }
    );
  } catch (error) {
    console.log(error);
    res.send({ status: "error", data: error });
  }
});

app.post("/removeFriend", async (req, res) => {
  const { token, friendId } = req.body;

  try {
    // Get the user email from the token
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }
    const userEmail = user.email;
    
    // Get the user id from the user email
    User.findOne({ email: userEmail })
      .then((data) => {
        const userId = data._id;
        
        // Get the friend request from the friend
        UserFriends.findOne({ user: friendId, friend: userId })
          .then((data) => {
            if (data) {
              // Delete the friend request
              UserFriends.deleteOne({ user: friendId, friend: userId })
                .then((data) => {
                  res.send({ status: "ok", data: "Successfully removed friend" });
                })
                .catch((error) => {
                  console.log(error);
                });
            }
            else {
              // Get the friend request from the user
              UserFriends.findOne({ user: userId, friend: friendId })
                .then((data) => {
                  if(data) {
                    // Delete the friend request
                    UserFriends.deleteOne({ user: userId, friend: friendId })
                      .then((data) => {
                        res.send({ status: "ok", data: "Successfully removed friend" });
                      })
                      .catch((error) => {
                        console.log(error);
                      });
                  } else {
                    res.send({ status: "error", data: "No friend request found" });
                  }
                })
                .catch((error) => {
                  console.log(error);
                });
            }
          })
          .catch((error) => {
            console.log(error);
          });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      }
    );
  } catch (error) {
    console.log(error);
    res.send({ status: "error", data: error });
  }
});

app.post("/getFriends", async (req, res) => {                         // done
  const { token } = req.body;

  try {
    // Get the user email from the token
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }
    const userEmail = user.email;

    // Get the user id from the user email
    User.findOne({ email: userEmail })
      .then((data) => {
        const userId = data._id;

        // Get the friends of the user
        UserFriends.find({ user: userId, status: 'Accepted' })
          .then((data) => {
            let friends = [];
            data.forEach((friend) => {
              friends.push(friend.friend);
            });

            // Get the friends of the user
            UserFriends.find({ friend: userId, status: 'Accepted' })
              .then((data) => {
                data.forEach((friend) => {
                  friends.push(friend.user);
                });

                User.find({ _id: { $in: friends } })
                  .then((data) => {
                    res.send({ status: "ok", data: data });
                  })
                  .catch((error) => {
                    console.log(error);
                  });
              })
              .catch((error) => {
                console.log(error);
              });
          })
          .catch((error) => {
            console.log(error);
          });

      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      }
    );
  } catch (error) {
    console.log(error);
    res.send({ status: "error", data: error });
  }
});
              
app.post("/getFriendRequests", async (req, res) => {                  // done
  const { token } = req.body;

  try {
    // Get the user email from the token
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }
    const userEmail = user.email;
    
    // Get the user id from the user email
    User.findOne({ email: userEmail })
      .then((data) => {
        const userId = data._id;

        // Get the friend requests of the user
        UserFriends.find({ friend: userId, status: 'Pending' })
          .then((data) => {
            let friendRequests = [];
            let friendRequestsUserIds = [];
            
            data.forEach((friendRequest) => {
              friendRequestsUserIds.push(friendRequest.user);
              friendRequests.push(friendRequest);
            });

            User.find({ _id: { $in: friendRequestsUserIds } })
              .then((data) => {
                let friendRequestsData = [];
                data.forEach((friend) => {
                  // Get the created at date of the friend request
                  let requestDate = "";
                  friendRequests.forEach((friendRequest) => {
                    if (friendRequest.user._id.toString() == friend._id.toString()) {
                      requestDate = friendRequest.createdAt;
                      console.log(requestDate)
                    }
                  });

                  let friendData = {
                    id: friend._id,
                    fname: friend.fname,
                    lname: friend.lname,
                    profilePic: friend.profilePic,
                    requestedAt: requestDate,
                  }
                  friendRequestsData.push(friendData);
                });

                res.send({ status: "ok", data: friendRequestsData });

              })
              .catch((error) => {
                console.log(error);
              });
          })
          .catch((error) => {
            console.log(error);
          });

      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      }
    );
  } catch (error) {
    console.log(error);
    res.send({ status: "error", data: error });
  }
});


app.post("/getUserData", async (req, res) => {
  const { token } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }

    const useremail = user.email;
    User.findOne({ email: useremail })
      .then(async (data) => {
        const friends = await UserFriends.find({ user: data._id, status: 'Accepted' })
        res.send({ status: "ok", data: {...data._doc, numFriends: friends.length} });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      });
  } catch (error) { }
});

app.post("/getUserData/:id", async (req, res) => {
  const { token } = req.body;
  let userId = req.params.id
  try {
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }
    const order = await User.findOne({email: user.email});
    User.findOne({ "_id": userId })
      .then(async (data) => {
        const friends = await UserFriends.find({$or: [{ user: userId, status: 'Accepted' }, { friend: userId, status: 'Accepted' }]})
        let userData = {
          id: data._id,
          fname: data.fname,
          lname: data.lname,
          userType: data.userType,
          position: data.position,
          description: data.description,
          profilePic: data.profilePic,
          profileBanner: data.profileBanner,
          createdAt: data.createdAt,
          numFriends: friends.length,
          own: userId === order._id.toString()
        }
        res.send({ status: "ok", data: userData });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      });
  } catch (error) { 
    console.log(error)
  }
});

app.post("/getTeamData/:id", async (req, res) => {
  let teamId = req.params.id;
  const { token } = req.body;
  try {

    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }

    const useremail = user.email;
    User.findOne({ email: useremail })
      .then((user) => {
        
        // Get the member count of the team
        TeamMembers.countDocuments({ "team": teamId })
        .then((memberCount) => {
          
          Team.findOne({ "_id": teamId })
          .then((teamDataTemp) => {
            let teamData = {
              id: teamDataTemp._id,
              name: teamDataTemp.name,
              sportsType: teamDataTemp.sportsType,
              gender: teamDataTemp.gender,
              description: teamDataTemp.description,
              profilePic: teamDataTemp.profilePic,
              profileBanner: teamDataTemp.profileBanner,
              memberCount: memberCount,
              createdAt: teamDataTemp.createdAt,
            }

            // Check if the user is a the admin of the team
            TeamMembers.findOne({ "team": teamId, "user": user._id, "role": "Admin" })
            .then((data) => {
              if (data) {
                teamData.isAdmin = true;
                teamData.inviteCode = teamDataTemp.inviteCode;
              } else {
                teamData.isAdmin = false;
              }

              // Return the team data
              res.send({ status: "ok", data: teamData });
          })
          .catch((error) => {
            res.send({ status: "error", data: error });
          });
          
        })
        .catch((error) => {
          res.send({ status: "error", data: error });
        });

      })
      .catch((error) => {
        res.send({ status: "error", data: error });
    });
  })
  .catch((error) => {
    res.send({ status: "error", data: error });
});

  } catch (error) { 
    console.log(error)
  }
});

app.post("/picUpload", async (req, res) => {
  const { token } = req.body;
  const newpath = __dirname + "/public/profiles/";
  const file = req.files.file;

  // Give the file a unique name
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const filename = uniqueSuffix + "-" + file.name;
  
  try {
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    } else {
      file.mv(`${newpath}${filename}`, (err) => {
        if (err) {
          res.status(500).send({ message: "File upload failed", code: 200 });
        } else {
          res.status(200).send({ message: "File Uploaded", data: "http://127.0.0.1:5000/profiles/"+filename, code: 200 });
        }
      });
    }
  
  } catch (error) {
    console.log(error);
    res.send({ status: "error", data: error });
  }
});

app.post("/createTeam", async (req, res) => {                             // done
  const {name, sportsTypeId, gender, members, description, profilePic, profileBanner, token} = req.body;

  // Create a random invite code
  const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  try {
    // Get the user email from the token
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }
    const userEmail = user.email;

    // Get the user id from the user email
    User.findOne({ email: userEmail })
      .then((data) => {
        const userId = data._id;

        // Create the team
        const team = new Team({
          name: name,
          sportsType: sportsTypeId,
          gender: gender,
          members: members,
          description: description,
          profilePic: profilePic,
          profileBanner: profileBanner,
          inviteCode: inviteCode,
        });

        team.save()
          .then(async (data) => {
            const teamId = data._id;

            // Add the user as a Admin of the team
            const teamAdminMember = new TeamMembers({
              team: teamId,
              user: userId,
              role: "Admin",
            });

            try {
              for(let member of members) {
                const teamMember = new TeamMembers({
                  team: teamId,
                  user: member,
                  role: ""
                })
                await teamMember.save()
              }
              const data = await teamAdminMember.save()
              res.send({ status: "ok", data: data });
            } catch (error) {
              res.send({ status: "error", data: error });
            }
          })
          .catch((error) => {
            res.send({ status: "error", data: error });
          });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      });
  } catch (error) {
    console.log(error);
    res.send({ status: "error", data: error });
  }
});

app.post("/updateTeam", async (req, res) => {
  // Function for team admins to update the team data
  let {teamId, name, sportsTypeId, gender, ageGroup, description, profilePic, profileBanner, token} = req.body;

  try {
    // Get the user email from the token
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }
    const userEmail = user.email;

    // Get the user id from the user email
    User.findOne({ email: userEmail })
      .then((data) => {
        const userId = data._id;

        // Check if the user is a admin of the team
        TeamMembers.findOne({ team: teamId, user: userId })
          .then((data) => {
            if (data.role == "Admin") {
              // Update the team data

              // If a value is not provided, then the value will be set to the previous value
              if(name == null || name == "") {
                name = data.name;
              }
              if(sportsTypeId == null || sportsTypeId == "") {
                sportsTypeId = data.sportsTypeId;
              }
              if(gender == null || gender == "") {
                gender = data.gender;
              }
              if(ageGroup == null || ageGroup == "") {
                ageGroup = data.ageGroup;
              }
              if(description == null || description == "") {
                description = data.description;
              }
              if(profilePic == null || profilePic == "") {
                profilePic = data.profilePic;
              }
              if(profileBanner == null || profileBanner == "") {
                profileBanner = data.profileBanner;
              }

              Team.updateOne(
                { _id: teamId },
                {
                  name: name,
                  sportsType: sportsTypeId,
                  gender: gender,
                  ageGroup: ageGroup,
                  description: description,
                  profilePic: profilePic,
                  profileBanner: profileBanner,
                }
              )
                .then((data) => {
                  res.send({ status: "ok", data: "Successfully updated team" });
                })
                .catch((error) => {
                  res.send({ status: "error", data: error });
                });
            } else {
              res.send({ status: "error", data: "You are not a admin of this team" });
            }
          })
          .catch((error) => {
            res.send({ status: "error", data: error });
          });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      });
  } catch (error) {
    console.log(error);
    res.send({ status: "error", data: error });
  }
});

app.post("/getTeams", async (req, res) => {
  const { token } = req.body;
  
  // Get all teams the user is a member of
  const user = jwt.verify(token, JWT_SECRET, (err, res) => {
    if (err) {
      return "token expired";
    }
    return res;
  });
  if (user == "token expired") {
    return res.send({ status: "error", data: "token expired" });
  }

  const userEmail = user.email;
  try {
    // Get the user id from the user email
    User.findOne({ email: userEmail })
      .then((data) => { 
        const userId = data._id;
        TeamMembers.find({ user: userId })
          .then((data) => {
            let teamIds = [];
            data.forEach((team) => {
              teamIds.push(team.team);
            });
            let teamsData = [];
            Team.find({ _id: { $in: teamIds } })
              .then(async (teams) => {
                for (let team of teams) {
                  let avatars = []
                  const members = await TeamMembers.find({team: team._id});
                  for (let member of members) {
                    const userInfo = await User.findOne({_id: member.user})
                    avatars.push(userInfo.profilePic)
                    if (avatars.length > 4) break;
                  }
                  let teamData = {
                    id: team._id,
                    name: team.name,
                    sportsType: team.sportsType,
                    gender: team.gender,
                    avatars,
                    membersCount: members.length,
                    description: team.description,
                    profilePic: team.profilePic,
                    profileBanner: team.profileBanner,
                    createdAt: team.createdAt
                  }
                  teamsData.push(teamData);
                }

                res.send({ status: "ok", data: teamsData });
              })
              .catch((error) => {
                res.send({ status: "error", data: error });
              });
          })
          .catch((error) => {
            res.send({ status: "error", data: error });
          });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      });
  } catch (error) {
    console.log(error);
    res.send({ status: "error", data: error });
  }
});
app.post("/getAllTeams", async (req, res) => {
  const { token } = req.body;
  
  // Get all teams the user is a member of
  const user = jwt.verify(token, JWT_SECRET, (err, res) => {
    if (err) {
      return "token expired";
    }
    return res;
  });
  if (user == "token expired") {
    return res.send({ status: "error", data: "token expired" });
  }

  const userEmail = user.email;
  try {
    // Get the user id from the user email
    const userInfo = await User.findOne({ email: userEmail });
    const yourTeams = await TeamMembers.find({user: userInfo._id});
    const yourTeamsIds = yourTeams.map(team => team.team.toString());
    const allTeams = await Team.find();
    const extraTeams = allTeams.filter(team => yourTeamsIds.indexOf(team._id.toString()) < 0)
    let teamsData = []
    for (let team of extraTeams) {
      let avatars = []
      const members = await TeamMembers.find({team: team._id});
      for (let member of members) {
        const userInfo = await User.findOne({_id: member.user})
        avatars.push(userInfo.profilePic)
        if (avatars.length > 4) break;
      }
      let teamData = {
        id: team._id,
        name: team.name,
        sportsType: team.sportsType,
        gender: team.gender,
        avatars,
        membersCount: members.length,
        description: team.description,
        profilePic: team.profilePic,
        profileBanner: team.profileBanner,
        createdAt: team.createdAt
      }
      teamsData.push(teamData);
    }
    res.send({ status: "ok", data: teamsData });

  } catch (error) {
    console.log(error);
    res.send({ status: "error", data: error });
  }
});

app.post("/getTeamMembers", async (req, res) => {
  const { token, teamId } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }
    
    TeamMembers.find({ team: teamId })
      .then((teamMembersData) => {
        let teamMembers = [];
        let userIds = [];
        teamMembersData.forEach((user) => {
          if(user.role == undefined){
            user.role = "Member";
          }
          teamMembers.push([user.user, user.role]);
          userIds.push(user.user);
        });
        let usersData = [];

        // Get all the users in the team
        User.find({ _id: { $in: userIds } })
          .then((users) => {
            users.forEach((user) => {
              // Get the role from the teamMembers array
              let role = "";
              teamMembers.forEach((teamMember) => {
                if (teamMember[0] == user.id) {
                  role = teamMember[1];
                }
              });

              let userData = {
                id: user.id,
                fname: user.fname,
                lname: user.lname,
                userType: user.userType,
                position: user.position,
                description: user.description,
                profilePic: user.profilePic,
                profileBanner: user.profileBanner,
                createdAt: user.createdAt,
                role: role,
              }
              usersData.push(userData);
            });
            res.send({ status: "ok", data: usersData });
          })
          .catch((error) => {
            res.send({ status: "error", data: error });
          });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      });
  } catch (error) {
    console.log(error);
    res.send({ status: "error", data: error });
  }
});

app.get("/getSports", async (req, res) => {
  let sportsData = [];
  Sports.find()
    .then((data) => {

      data.forEach((sport) => {
        let sportData = {
          id: sport._id,
          name: sport.name,
          description: sport.description,
          profilePic: sport.profilePic,
        }
        sportsData.push(sportData);
      });

      res.send({ status: "ok", data: sportsData });
    })
    .catch((error) => {
      res.send({ status: "error", data: error });
    });
});

app.get("/getSports/:id", async (req, res) => {
  let sportId = req.params.id
  try {
    Sports.findOne({ "_id": sportId })
      .then((data) => {
        let sportData = {
          id: data._id,
          name: data.name,
          description: data.description,
          profilePic: data.profilePic,
        }
        res.send({ status: "ok", data: sportData });
      })
      .catch((error) => {
        res.send({ status: "error", data: error });
      });
  } catch (error) {
    console.log(error)
  }
});

app.post("/createEvent", async (req, res) => {
  const { token, name, description, location, date, startTime, endTime, teamId, repeat, members, cost } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }

    const creator = await User.findOne({email: user.email})

    const newEvent = new Event({
      name,
      description,
      location,
      date,
      startTime,
      endTime,
      team: teamId,
      repeat,
      members,
      cost
    });

    newEvent.save();

    // Create Pending Event for all team members
    const newUserEvent = new UserEvents({
      user: creator._id,
      event: newEvent._id,
      status: "Accepted",
    });
    newUserEvent.save();
    for (let member of members) {
      const newUserEvent = new UserEvents({
        user: member,
        event: newEvent._id,
        status: "Pending Invite",
      });
      newUserEvent.save();
    }
    res.send({ status: "ok", data: "Event Created" });

  } catch (error) {
    console.log(error);
    res.send({ status: "error", data: error });
  }
});

app.post("/getEvents", async (req, res) => {
  const { token, userId, status } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }
    const userEmail = user.email;

    // Get the user id from the user email
    User.findOne({ email: userEmail })
      .then((data) => {
        const user = userId ? userId : data._id;

        UserEvents.find({ user: user, status: status })
          .then((data) => {

            let eventIds = [];
            data.forEach((event) => {
              eventIds.push(event.event);
            });
            let eventsData = [];
            Event.find({ _id: { $in: eventIds } })
              .then(async (data) => {
                for (let event of data) {
                  const teamInfo = await Team.findOne({_id: event.team})
                  const sportInfo = await Sports.findById(teamInfo.sportsType)
                  let eventData = {
                    id: event._id,
                    name: event.name,
                    sport: sportInfo.name,
                    description: event.description,
                    location: event.location,
                    date: event.date,
                    startTime: event.startTime,
                    endTime: event.endTime,
                    teamName: teamInfo.name,
                    opponentName: event.opponent,
                    repeat: event.repeat,
                    cost: event.cost
                  }
  
                  eventsData.push(eventData);
                }

                res.send({ status: "ok", data: eventsData });
              })
              .catch((error) => {
                res.send({ status: "error", data: error });
              });
          })
          .catch((error) => {
            res.send({ status: "error", data: error });
          });
      })

  } catch (error) {
    console.log(error);
    res.send({ status: "error", data: error });
  }
});

app.post("/acceptEventInvite", async (req, res) => {
  const { token, eventId } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }
    const userEmail = user.email;

    // Get the user id from the user email
    User.findOne({ email: userEmail })
      .then((data) => {
        const userId = data._id;

        UserEvents.findOneAndUpdate({ user: userId, event: eventId }, { status: "Accepted" })
          .then((data) => {
            res.send({ status: "ok", data: "Event Accepted" });
          })
          .catch((error) => {
            res.send({ status: "error", data: error });
          });
      })
      
  } catch (error) {
    console.log(error);
    res.send({ status: "error", data: error });
  }
});

app.post("/rejectEventInvite", async (req, res) => {
  const { token, eventId } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET, (err, res) => {
      if (err) {
        return "token expired";
      }
      return res;
    });
    if (user == "token expired") {
      return res.send({ status: "error", data: "token expired" });
    }
    const userEmail = user.email;

    // Get the user id from the user email
    User.findOne({ email: userEmail })
      .then((data) => {
        const userId = data._id;

        UserEvents.findOneAndUpdate({ user: userId, event: eventId }, { status: "Rejected" })
          .then((data) => {
            res.send({ status: "ok", data: "Event Rejected" });
          })
          .catch((error) => {
            res.send({ status: "error", data: error });
          });
      })

  } catch (error) {
    console.log(error);
    res.send({ status: "error", data: error });
  }
});

app.listen(5000, () => {
  console.log("Server Started");
});

app.get("/forgot-password", async (req, res) => {
  //const { email } = req.body;
  email = "louisklimek@gmail.com"

  try {
    const oldUser = await User.findOne({ email });
    if (!oldUser) {
      return res.json({ status: "User does not Exist!" });
    }
    console.log(oldUser);
    const secret = JWT_SECRET + oldUser.password;
    const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
      expiresIn: "5m",
    });
    console.log(token);
    const link = `http://127.0.0.1:5000/reset-password/${oldUser._id}/${token}`;
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        type: "OAuth2",
        user: "alimangostudios@gmail.com",
        clientId: "860363559753-81v9dv2pnk1she3tt8cd6766e6i7t3gl.apps.googleusercontent.com",
        clientSecret: "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",
        refreshToken: "1//04zYDt6CXDlN0CgYIARAAGAQSNwF-L9IrBvykWUdiqP7qy2-zOHoUPSOvazN9csEWNWxVtT61a950aewz4X_qufSz97utRweIi0Q",
        accessToken: "ya29.a0AbVbY6MhWvUAMTO2FmhlUJ0X2EmeBuE4j2CVZYqm4PAy_nyd876ewhTM36-hvMFffdA5fUA9Q0kLLaKPPasWg8KXYHWKV6HnsgLLCBFlsMU7C0Fh91sL2PF9isX3cVmhEf9VmK7pvaj5mZ_Hg9V4CO996f3gaCgYKAbcSARISFQFWKvPlj2HfONnL874VVnTWL2sJ2w0163",
        expires: 1484314697598,
      },
    });
    

    var mailOptions = {
      from: "SportsPlatform@gmail.com",
      to: email,
      subject: "Password Reset",
      text: link,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    console.log(link);
  } catch (error) { }
});

app.get("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  console.log(req.params);
  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: "User does not Exist!" });
  }
  const secret = JWT_SECRET + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    res.render("index", { email: verify.email, status: "Not Verified" });
  } catch (error) {
    console.log(error);
    res.send("Not Verified");
  }
});

app.post("/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  const oldUser = await User.findOne({ _id: id });
  if (!oldUser) {
    return res.json({ status: "User Not Exists!!" });
  }
  const secret = JWT_SECRET + oldUser.password;
  try {
    const verify = jwt.verify(token, secret);
    const encryptedPassword = await bcrypt.hash(password, 10);
    await User.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          password: encryptedPassword,
        },
      }
    );

    res.render("index", { email: verify.email, status: "verified" });
  } catch (error) {
    console.log(error);
    res.json({ status: "Something Went Wrong" });
  }
});

app.get("/getAllUser", async (req, res) => {
  try {
    const allUser = await User.find({});
    res.send({ status: "ok", data: allUser });
  } catch (error) {
    console.log(error);
  }
});


app.post("/upload-image", async (req, res) => {
  const { base64 } = req.body;
  try {
    await Images.create({ image: base64 });
    res.send({ Status: "ok" })

  } catch (error) {
    res.send({ Status: "error", data: error });

  }
})

app.get("/get-image", async (req, res) => {
  try {
    await Images.find({}).then(data => {
      res.send({ status: "ok", data: data })
    })

  } catch (error) {

  }
})

app.get("/paginatedUsers", async (req, res) => {
  const allUser = await User.find({});
  const page = parseInt(req.query.page)
  const limit = parseInt(req.query.limit)

  const startIndex = (page - 1) * limit
  const lastIndex = (page) * limit

  const results = {}
  results.totalUser=allUser.length;
  results.pageCount=Math.ceil(allUser.length/limit);

  if (lastIndex < allUser.length) {
    results.next = {
      page: page + 1,
    }
  }
  if (startIndex > 0) {
    results.prev = {
      page: page - 1,
    }
  }
  results.result = allUser.slice(startIndex, lastIndex);
  res.json(results)
})


app.post("/addSportsType", async (req, res) => {
  const { name, description, profilePic, adminKey } = req.body;
  

  if(adminKey == JWT_SECRET){
    try {
      const sportsType = await Sports.create({
        name: name,
        description: description,
        profilePic: profilePic,
      });
      res.send({ status: "ok", data: sportsType });
    } catch (error) {
      res.send({ status: "error", data: error });
    }
  }

});
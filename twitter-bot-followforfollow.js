console.log('The bot is starting');

const Twit = require('twit');
const config = require('./config');
const T = new Twit(config);
const fs = require('fs');
const stream = T.stream('user');


// TWEET STREAM

stream.on('tweet', tweeted);

function tweeted(eventMsg) {
    // Grabbing the tweet text, user id and screen name
    const screen_name = eventMsg.user.screen_name;
    const user_id = eventMsg.user.id;
    const text = eventMsg.text;
    const status_id = eventMsg.id;
    const twitter_handle = 'Hamdalofficial';


    if (text.indexOf('#followforfollow') != -1 ) {
        console.log('follow this user back');

        // Getting account followers
        T.get('followers/ids', {screen_name: twitter_handle}, function(err, data, response) { 
            followers = data.ids;

            // checking to see if the user is among account followers
            isfollowing = followers.findIndex(function(follower) {
                console.log(follower);
                if (follower == user_id) {
                    return true;
                }
            });

            if (isfollowing != -1) {
                followUser(user_id, status_id, screen_name);
                // Add the user to the list of followforfollow users
                const fs = require('fs');
                users = JSON.parse(fs.readFileSync('followers.json', 'utf-8'));
                users.followers_arr.push(user_id);
                users.no_of_followers += 1;
                // Writing it back to file
                fs.writeFileSync('followers.json', JSON.stringify(users));
                console.log(users)
            }
            else {
                // Tweeting to let the user know that they have to follow first before sending the #followforfollow tweet
                params = {
                    status: '@' + screen_name + ' you have to follow first before tweeting, do that and you will be followed back instantly'
                }

                T.post('statuses/update', params, () => {});
            }
        });

       
    }
    else {
        // CHECKING IF A USER FOLLOWED BY #FOLLOWFORFOLLOW HAS UNFOLLOWED
    }
}


function followUser(user_id, status_id, screen_name) {
    console.log('Follow user process starting');
    params = {
        user_id: user_id
    }
    console.log(user_id);

    function followed(err, data, response) {
        if (err) {
            console.log(err);
        }
        else {
            var params = {
                status: '@' + screen_name + ' Thanks for the follow, you\'ve been followed back.',
                in_reply_to_status_id: status_id
            }

            T.post('statuses/update', params, (err, data) => {
                if (err) {
                    console.log('There was a problem sending a direct message to the user')
                }
                else {
                    console.log('a message has been sent to the user')
                    console.log(status_id, screen_name);
                }    
            });

            console.log('User has been followed back and.')
        }
    }

    T.post('friendships/create', params, followed);

    // Add new user to the file
}


// // FOLLOW STREAM

// stream.on('follow', followed);

// function followed(eventMsg) {

//     // Get the current no of followers
//     T.get('followers/ids', function(err, data, response) {
//         var followers = {
//             followers_arr: [],
//             no_of_followers: 0
//         }

//         if (err) {
//             console.log('an error has occured in getting user followers');
//         }
//         else {
//             // update the followers update with the data and save it to file
//             followers.followers_arr = data.ids;
//             followers.no_of_followers = data.ids.length;

//             // Writting followers object to file
//             const fs = require('fs');
//             var json = JSON.stringify(followers, null, 2);
//             fs.writeFile('followers.json', json);  
//         }
//     });
// }

function checkFollowing() {
    // retrieve current following
    T.get('followers/ids', function(err, data, response) {
        var followers = {
            followers_arr: [],
            no_of_followers: 0
        }
        if (err) {
            console.log('an error has occured in getting user followers');
        }
        else {
            // update the followers update with the data and save it to file
            followers.followers_arr = data.ids;
            followers.no_of_followers = data.ids.length;
        }
    

    // retrieve the previous following object from file

    // reading followers object from file
    const fs = require('fs');
    data = JSON.parse(fs.readFileSync('followers.json', 'utf-8'));

    var new_no_of_followers = followers.no_of_followers;
    var no_of_fff_followers = data.no_of_followers;
    var new_followers = followers.followers_arr;
    var fff_followers = data.followers_arr;

    // comparing the length property of followers in both objects to determine an unfollow event has occured
    if (new_no_of_followers == no_of_fff_followers) {
        // no user has unfollowed you
    }
    else {
        // One or more users have unfollowed
        fff_followers.map((value) => {
            if (value in new_followers) {
                // The user is still following 
            }
            else {
                // This user has unfollowed and so the user is unfollowed
                params = {
                    user_id: value
                }

                function unfollowed(err, data, response) {
                    if (err) {
                        console.log('Error unfollowing user');
                    }
                    else {
                        console.log('User has been unfollowed');
                    }
                }

                T.post('friendships/destroy', params, unfollowed);

                // remove the user from the stored file
                const fs = require('fs');
                users = JSON.parse(fs.readFileSync('followers.json', 'utf-8'));
                user_index = fff_followers.indexOf(value);
                users.followers_arr.splice(user_index, 1);
                if (users.no_of_followers > 0) {
                    users.no_of_followers -= 1;
                }
                
                // Writing it back to file
                fs.writeFileSync('followers.json', JSON.stringify(users));
                console.log(users)

            }
        });
    }
});    

}

setInterval(checkFollowing, 300000);
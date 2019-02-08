import React, { useContext, useEffect, useState } from "react";
import Button from "../../component/button/button.component";
import { firebase, firestore, database } from "../../firebase";
import { getState, DispatchContext } from "../../redux";
import { updateUser } from "./action";
import {
  AuthStyled,
  AuthGreetWrapper,
  AvatarStyled,
  ButtonWrapper
} from "./auth.style";

const Auth = () => {
  const dispatch = useContext(DispatchContext);
  const user = getState("user");
  const [uid, setUid] = useState();

  const onlineRef = database.ref(".info/connected");
  const userRef = firestore.collection("user");

  useEffect(() => {
    // check if the user is already logged in
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        // User is signed in.
        const userInfo = user.providerData[0];
        const { uid } = userInfo;
        setUid(uid);
        dispatch(updateUser(userInfo));

        onlineRef.on("value", snap => {
          database
            .ref(`/status/${uid}`)
            .onDisconnect()
            .set("offline")
            .then(() => {
              database.ref(`/status/${uid}`).set("online");
              userRef.doc(uid).set(
                {
                  online: true
                },
                { merge: true }
              );
            });
        });
      } else {
        // No user is signed in.
      }
    });
  }, []);

  const handleLogIn = () => {
    console.log(`Log me in now!`);
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    // This custom parameter is optional
    // googleProvider.setCustomParameters({
    //   login_hint: "username@gmail.com"
    // });

    // Launch pop-up
    firebase
      .auth()
      .signInWithPopup(googleProvider)
      .then(result => {
        const user = result.user.providerData[0];
        console.log(`Signed in successful`, result);
        dispatch(updateUser(user));

        console.log(`User data`, user);
        userRef.doc(user.uid).set({ ...user }, { merge: true });

        /**
         * This was used to genertate the tables for member and admin
         *  a log in and log out was done to add users to the tables
         */
        // firestore
        //   .collection("member")
        //   .doc(user.uid)
        //   .set({ ...user }, { merge: true });
      });
  };

  const handleLogOut = () => {
    database.ref(`/status/${uid}`).set("offline");

    setUid(null);
    firebase
      .auth()
      .signOut()
      .then(() => {
        console.info(`Sign out successful`);
        dispatch(updateUser(null));
      })
      .catch(error => console.log(`Sign out failed!`, error));
  };

  const loginButtonProperties = {
    label: "Log me in",
    onClick: handleLogIn
  };

  const logoutButtonProperties = {
    label: "Get me out",
    onClick: handleLogOut
  };

  return (
    <AuthStyled>
      {!user && <Button {...loginButtonProperties} />}
      {user && (
        <>
          <AvatarStyled width={32} url={user.photoURL} />
          <AuthGreetWrapper>Welcome {user.displayName}!</AuthGreetWrapper>
          <ButtonWrapper>
            <Button {...logoutButtonProperties} />
          </ButtonWrapper>
        </>
      )}
    </AuthStyled>
  );
};

export default Auth;

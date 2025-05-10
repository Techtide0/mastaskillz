import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  set,
  onChildAdded,
  update,
  get,
} from "firebase/database";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC1LlHnSsS7vsLSk1zDm4eXe-VoVxw6r3w",
  authDomain: "mastaskillz1-204ac.firebaseapp.com",
  databaseURL: "https://mastaskillz1-204ac-default-rtdb.firebaseio.com",
  projectId: "mastaskillz1-204ac",
  storageBucket: "mastaskillz1-204ac.appspot.com",
  messagingSenderId: "557219947961",
  appId: "1:557219947961:web:629605c47254f4e2f38268",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const App = () => {
  const [posts, setPosts] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [moreNav1, setMoreNav1] = useState(false);
  const [moreNav2, setMoreNav2] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    age: "",
    gender: "",
    bio: "",
    avatar: "",
    posts: [],
  });

  const titleRef = useRef();
  const descRef = useRef();
  const fileRef = useRef();

  useEffect(() => {
    const hardcoded = [
      {
        id: "hardcoded-1",
        avatar: "../images/lady1.jpg",
        name: "Alice",
        age: "25",
        gender: "Female",
        bio: "I love Reading New things!",
        title: "Excited to Join!",
        description: "Hey everyone, I’m new here and looking forward to connecting and contributing. What’s your favorite thing about this community?",
        likes: 8,
        comments: { 1: "Welcome!", 2: "Nice to have you here!", 3: "Hello Alice!" },
        shares: 0,
        timestamp: Date.now() - 100000,
      },
      {
        id: "hardcoded-2",
        avatar: "../images/lady2.jpg",
        name: "Bridget",
        age: "23",
        gender: "Female",
        bio: "I am a Data Analyst, so bring deals!",
        title: "5 Productivity Hacks That Changed My Life",
        description: "Want to get more done without burning out? Here are 5 practical tips that helped me double my output without stress.",
        likes: 4,
        comments: { 1: "Thanks for the tips!", 2: "Awesome!", 3: "So helpful!", 4: "Love this!", 5: "Agreed!", 6: "Great read." },
        shares: 0,
        timestamp: Date.now() - 50000,
      },
    ];

    setPosts(hardcoded);

    const postsRef = ref(database, "posts");
    onChildAdded(postsRef, (snapshot) => {
      const post = snapshot.val();
      setPosts((prev) => [...prev, post]);
    });

    const scrollHandler = () => {
      setMoreNav1(false);
      setMoreNav2(false);
      setOpenMenuId(null);
    };

    window.addEventListener("scroll", scrollHandler);
    return () => window.removeEventListener("scroll", scrollHandler);
  }, []);

  const handleCreatePost = () => {
    const title = titleRef.current.value.trim();
    const description = descRef.current.value.trim();
    const file = fileRef.current.files[0];

    if (!title || !description) {
      alert("Fill out both title and description.");
      return;
    }

    const newRef = push(ref(database, "posts"));
    const id = newRef.key;

    const newPost = {
      id,
      name: "Anonymous",
      title,
      description,
      image: "",
      likes: 0,
      comments: {},
      shares: 0,
      timestamp: Date.now(),
    };

    set(newRef, newPost);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => update(newRef, { image: e.target.result });
      reader.readAsDataURL(file);
    }

    titleRef.current.value = "";
    descRef.current.value = "";
    fileRef.current.value = "";
    setShowCreate(false);
  };

  const handleSort = (type) => {
    const sorted = [...posts];

    if (type === "newest") {
      sorted.sort((a, b) => b.timestamp - a.timestamp);
    } else if (type === "most liked") {
      sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (type === "most commented") {
      sorted.sort(
        (a, b) =>
          Object.keys(b.comments || {}).length -
          Object.keys(a.comments || {}).length
      );
    }

    setPosts(sorted);
  };

  const incrementLike = (post) => {
    if (post.id.startsWith("hardcoded-")) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, likes: (p.likes || 0) + 1 } : p
        )
      );
    } else {
      const likeRef = ref(database, "posts/" + post.id + "/likes");
      get(likeRef).then((snap) => {
        const likes = (snap.val() || 0) + 1;
        update(ref(database, "posts/" + post.id), { likes });
      });
    }
  };

  const handleShare = (post) => {
    if (navigator.share) {
      navigator
        .share({
          title: "Check this post out!",
          text: post.description,
          url: window.location.href,
        })
        .then(() => {
          if (!post.id.startsWith("hardcoded-")) {
            const shares = (post.shares || 0) + 1;
            update(ref(database, "posts/" + post.id), { shares });
          }
        })
        .catch((err) => console.log("Share failed:", err));
    } else {
      alert("Sharing is not supported in your browser.");
    }
  };

  const submitComment = (post, text) => {
    if (!text) return;
    const commentId = Date.now();
    const commentsRef = ref(database, `posts/${post.id}/comments/${commentId}`);
    set(commentsRef, text);
  };

  const openProfileModal = (post) => {
    const userPosts = posts.filter(p => p.name === post.name).map((p, i) => (
      <div key={i} className="modal-post">
        <p><strong>{p.title}</strong></p>
        <p>{p.description}</p>
      </div>
    ));

    setProfileData({
      name: post.name,
      age: post.age || "N/A",
      gender: post.gender || "N/A",
      bio: post.bio || "",
      avatar: post.avatar || "../images/guy3.jpg",
      posts: userPosts,
    });

    setShowModal(true);
  };

  const filteredPosts = posts.filter((post) => {
    const term = searchTerm.toLowerCase();
    return (
      post.title?.toLowerCase().includes(term) ||
      post.description?.toLowerCase().includes(term) ||
      post.name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="app">
      <div className="head">
        <h1 className="title">GENERAL COMMUNITY</h1>
        <div className="search">
          <form className="search-form" onSubmit={(e) => e.preventDefault()}>
            <button type="submit" className="search-btn fas fa-search"></button>
            <input
              type="search"
              className="box"
              id="search-box"
              placeholder="Search Post"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
        </div>
        <div className="navlinks">
          <a href="#">Marketplace</a>
          <a href="#">The Source</a>
          <a href="#">Gig Ninjas</a>
          <a href="#" onClick={() => setMoreNav1(!moreNav1)}>Explore More</a>
        </div>
        {moreNav1 && (
          <div className="othernavs navlinks">
            <a href="#">Don Norma</a>
            <a href="#">Zuckerberg</a>
            <a href="#">Bezos</a>
            <a href="#">Iweala</a>
            <a href="#">Elon</a>
            <a href="#">Steve Jobs</a>
            <a href="#">Picasso</a>
          </div>
        )}
      </div>

      <div className="creatsection">
        <div className="dropdown-toggle" onClick={() => setShowCreate(!showCreate)}>
          <p>Create a post here! <span className="arrow">{showCreate ? "▲" : "▼"}</span></p>
        </div>
        {showCreate && (
          <div className="create">
            <h4>POST CREATION</h4>
            <input type="text" placeholder="Title" ref={titleRef} />
            <textarea placeholder="Description" ref={descRef}></textarea>
            <div className="final">
              <input type="file" accept="image/*" ref={fileRef} />
              <input type="button" value="POST" onClick={handleCreatePost} />
            </div>
          </div>
        )}
      </div>

      <div className="sort">
        <p>Sorting Options</p>
        <div className="order">
          <button onClick={() => handleSort("newest")}>Newest</button>
          <button onClick={() => handleSort("most liked")}>Most Liked</button>
          <button onClick={() => handleSort("most commented")}>Most Commented</button>
        </div>
      </div>

      <div className="feed">
        {filteredPosts.map((post) => (
          <div className="post-card" key={post.id}>
            <div className="post-header">
              <img src={post.avatar || "../images/guy3.jpg"} className="avatar" alt="User" />
              <div className="user-info">
                <h4>
                  <span
                    onClick={() => openProfileModal(post)}
                    className="profile-link"
                    style={{ cursor: "pointer", textDecoration: "underline" }}
                  >
                    {post.name || "Anonymous"}
                  </span>
                </h4>
                <p>{post.title}</p>
                <span className="message">{post.description}</span>
              </div>
              <div className="menu">
                <i className="fas fa-ellipsis-h" onClick={() =>
                  setOpenMenuId(openMenuId === post.id ? null : post.id)
                }></i>
                {openMenuId === post.id && (
                  <div className="menu-dropdown">
                    <button>Save</button>
                    <button>Unfollow</button>
                  </div>
                )}
              </div>
            </div>
            {post.image && <img src={post.image} className="post-image" alt="Post" />}
            <div className="post-actions">
              <div onClick={() => incrementLike(post)}>
                <i className="fa-regular fa-thumbs-up"></i> <span className="like">{post.likes || 0}</span>
              </div>
              <div>
                <i className="fa-regular fa-comment"></i> <span className="comment-count">{Object.keys(post.comments || {}).length}</span>
              </div>
              <div onClick={() => handleShare(post)}>
                <i className="fa-solid fa-share"></i> <span id="share">{post.shares || 0}</span>
              </div>
            </div>
            <div className="comment-section">
              <div className="comments-list">
                {Object.values(post.comments || {}).map((cmt, idx) => (
                  <div key={idx}>{cmt}</div>
                ))}
              </div>
              <div className="comment-input">
                <input type="text" placeholder="Write a comment..." id={`comment-${post.id}`} />
                <button onClick={() => {
                  const input = document.getElementById(`comment-${post.id}`);
                  const text = input.value;
                  submitComment(post, text);
                  input.value = "";
                }}>Post</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="profile-modal">
          <div className="profile-content">
            <span className="close-profile" onClick={() => setShowModal(false)}>&times;</span>
            <img src={profileData.avatar} alt="Profile" className="profile-avatar" />
            <div className="modaltext">
              <h2>Name: {profileData.name}</h2>
              <p>Age: {profileData.age}</p>
              <p>Gender: {profileData.gender}</p>
              <p>Bio: {profileData.bio}</p>
              <p>Total posts: {profileData.posts.length}</p>
            </div>
            <hr />
            <div>{profileData.posts}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

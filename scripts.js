// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC1LlHnSsS7vsLSk1zDm4eXe-VoVxw6r3w",
  authDomain: "mastaskillz1-204ac.firebaseapp.com",
  databaseURL: "https://mastaskillz1-204ac-default-rtdb.firebaseio.com",
  projectId: "mastaskillz1-204ac",
  storageBucket: "mastaskillz1-204ac.appspot.com",
  messagingSenderId: "557219947961",
  appId: "1:557219947961:web:629605c47254f4e2f38268",
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const allPosts = [];

// UI Toggles
document.querySelector("#more1").addEventListener("click", () => {
  document.querySelector("#othernavs1").classList.toggle("active");
});
document.querySelector("#more2").addEventListener("click", () => {
  document.querySelector("#othernavs2").classList.toggle("active");
});

window.onscroll = () => {
  document.querySelector("#othernavs1")?.classList.remove("active");
  document.querySelector("#othernavs2")?.classList.remove("active");
};

document.querySelector(".dropdown-toggle").addEventListener("click", () => {
  const box = document.querySelector(".create");
  const arrow = document.querySelector(".arrow");
  box.classList.toggle("hidden");
  arrow.style.transform = box.classList.contains("hidden")
    ? "rotate(0deg)"
    : "rotate(180deg)";
});

function attachDropdownToggle(el) {
  const toggleBtn = el.querySelector(".menu-toggle");
  const dropdown = el.querySelector(".menu-dropdown");

  if (toggleBtn && dropdown && !toggleBtn.dataset.listenerAdded) {
    toggleBtn.addEventListener("click", () => {
      dropdown.classList.toggle("hidden");
    });
    toggleBtn.dataset.listenerAdded = "true";
  }
}

// Post rendering
function renderPosts(postsToRender) {
  const feed = document.querySelector(".feed");
  feed.innerHTML = "";
  postsToRender.forEach((post) => {
    feed.appendChild(post.element);
    attachDropdownToggle(post.element);

    const profileLink = post.element.querySelector(".profile-link");
    if (profileLink) {
      attachProfileModal(profileLink);
    }
  });
}

// Sorting
document.querySelectorAll(".order button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = btn.textContent.toLowerCase().trim();
    const sorted = [...allPosts];

    if (type === "newest") {
      sorted.sort((a, b) => b.data.timestamp - a.data.timestamp);
    } else if (type === "most liked") {
      sorted.sort((a, b) => (b.data.likes || 0) - (a.data.likes || 0));
    } else if (type === "most commented") {
      sorted.sort(
        (a, b) =>
          Object.keys(b.data.comments || {}).length -
          Object.keys(a.data.comments || {}).length
      );
    }

    renderPosts(sorted);
  });
});

// Search
document.querySelector(".search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const searchTerm = document.querySelector("#search-box").value.toLowerCase();

  const filtered = allPosts.filter(({ data }) => {
    const title = data.title?.toLowerCase() || "";
    const desc = data.description?.toLowerCase() || "";
    const name = data.name?.toLowerCase() || "";
    return (
      title.includes(searchTerm) ||
      desc.includes(searchTerm) ||
      name.includes(searchTerm)
    );
  });

  renderPosts(filtered);
});

// Modal
function attachProfileModal(linkEl) {
  linkEl.addEventListener("click", function (e) {
    e.preventDefault();
    const { name, age, gender, bio, avatar } = this.dataset;

    document.getElementById("profile-name").textContent = name;
    document.getElementById("profile-age").textContent = `Age: ${age}`;
    document.getElementById("profile-gender").textContent = `Gender: ${gender}`;
    document.getElementById("profile-bio").textContent = `Bio: ${bio}`;
    document.getElementById("profile-pic").src = avatar;

    const posts = document.querySelectorAll(".post-card");
    let count = 0;
    const container = document.getElementById("profile-latest-post");
    container.innerHTML = "";

    posts.forEach((post) => {
      const user = post.querySelector(".profile-link")?.dataset.name;
      if (user === name) {
        count++;
        const cloned = post.cloneNode(true);
        cloned
          .querySelectorAll("button, .like-btn, .comment-btn, .share-btn")
          .forEach((btn) => {
            btn.style.pointerEvents = "none";
          });
        container.appendChild(cloned);
      }
    });

    document.getElementById(
      "profile-posts"
    ).textContent = `Total posts: ${count}`;
    document.getElementById("profile-modal").classList.remove("hidden");
  });
}
function closeProfileModal() {
  document.getElementById("profile-modal").classList.add("hidden");
}

// Likes
window.incrementLike = function (el) {
  const postCard = el.closest(".post-card");
  const postId = postCard.dataset.id;
  const likeEl = el.querySelector(".like");

  if (postId.startsWith("hardcoded-")) {
    let currentLikes = parseInt(likeEl.textContent) || 0;
    likeEl.textContent = currentLikes + 1;
    return; // Skip Firebase
  }

  const postRef = database.ref("posts/" + postId + "/likes");
  postRef.transaction(
    (likes) => (likes || 0) + 1,
    (_, committed, snap) => {
      if (committed) likeEl.textContent = snap.val();
    }
  );
};

// Comments
function submitComment(button) {
  const postCard = button.closest(".post-card");
  const postId = postCard.dataset.id;
  const input = button.previousElementSibling;
  const text = input.value.trim();
  if (!text) return;

  const commentsList = postCard.querySelector(".comments-list");
  const newComment = document.createElement("div");
  newComment.textContent = text;
  commentsList.appendChild(newComment);

  const commentCount = postCard.querySelector(".comment-count");
  commentCount.textContent = parseInt(commentCount.textContent) + 1;
  input.value = "";

  const commentId = Date.now();
  database.ref("posts/" + postId + "/comments/" + commentId).set(text);
}

// Toggle Comments
function toggleComments(el) {
  const section = el.closest(".post-card").querySelector(".comment-section");
  section.classList.toggle("hidden");
}

// Shares
function handleShare(el) {
  const postCard = el.closest(".post-card");
  const title = postCard.querySelector(".user-info p").textContent;
  const description = postCard.querySelector(".message").textContent;

  if (navigator.share) {
    navigator
      .share({
        title: "Check this post out!",
        text: "I'm sharing a post from the community feed.",
        url: window.location.href,
      })
      .then(() => {
        database.ref("posts").once("value", (snap) => {
          snap.forEach((child) => {
            const data = child.val();
            if (data.title === title && data.description === description) {
              const shares = data.shares || 0;
              child.ref.update({ shares: shares + 1 });
            }
          });
        });
      })
      .catch((err) => console.log("Share failed:", err));
  } else {
    alert("Sharing is not supported in your browser.");
  }
}

// Create Post
document.querySelector("#create-post-btn").addEventListener("click", () => {
  const title = document
    .querySelector('.create input[type="text"]')
    .value.trim();
  const desc = document.querySelector(".create textarea").value.trim();
  const file = document.querySelector("#logo").files[0];
  if (!title || !desc) return alert("Fill out both title and description.");

  const newRef = database.ref("posts").push();
  const id = newRef.key;

  newRef.set({
    id,
    title,
    description: desc,
    image: "",
    likes: 0,
    comments: {},
    shares: 0,
    timestamp: Date.now(),
  });

  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => newRef.update({ image: e.target.result });
    reader.readAsDataURL(file);
  }

  document.querySelector('.create input[type="text"]').value = "";
  document.querySelector(".create textarea").value = "";
  document.querySelector("#logo").value = "";
  document.querySelector(".create").classList.add("hidden");
  document.querySelector(".arrow").style.transform = "rotate(0deg)";
});

// Real-time Post Loading
database.ref("posts").on("child_added", (snapshot) => {
  const post = snapshot.val();
  const postId = snapshot.key;

  const el = document.createElement("div");
  el.className = "post-card";
  el.dataset.id = postId;
  el.innerHTML = `
  <div class="post-header">
    <img src="${post.avatar || "images/guy3.jpg"}" class="avatar" />
    <div class="user-info">
      <h4>
        <a href="#" class="profile-link"
          data-name="Oseni Matthew"
          data-age="21"
          data-gender="Male"
          data-bio="I am a graphics designer, and a game enthusiast, lets connect!"
          data-avatar="images/guy3.jpg">
          Matthew
        </a>
      </h4>
      <p>${post.title}</p>
      <span class="message">${post.description}</span>
    </div>
    <div class="menu">
      <i class="fas fa-ellipsis-h menu-toggle"></i>
      <div class="menu-dropdown hidden">
        <button>Save</button>
        <button>Unfollow</button>
      </div>
    </div>
  </div>
  ${post.image ? `<img src="${post.image}" class="post-image" />` : ""}
  <div class="post-actions">
    <div class="like-btn"><i class="fa-regular fa-thumbs-up"></i> <span class="like">${
      post.likes || 0
    }</span></div>
    <div class="comment-btn"><i class="fa-regular fa-comment"></i> <span class="comment-count">${
      Object.keys(post.comments || {}).length
    }</span></div>
    <div class="share-btn"><i class="fa-solid fa-share"></i> <span id="share">${
      post.shares || 0
    }</span></div>
  </div>
  <div class="comment-section hidden">
    <div class="comments-list"></div>
    <div class="comment-input">
      <input type="text" placeholder="Write a comment..." />
      <button onclick="submitComment(this)">Post</button>
    </div>
  </div>
`;

  // Attach listeners
  el.querySelector(".like-btn").addEventListener("click", function () {
    window.incrementLike(this);
  });
  el.querySelector(".comment-btn").addEventListener("click", function () {
    toggleComments(this);
  });
  el.querySelector(".share-btn").addEventListener("click", function () {
    handleShare(this);
  });

  const profileLink = el.querySelector(".profile-link");
  if (profileLink) {
    attachProfileModal(profileLink);
  }

  allPosts.push({ data: post, element: el });
  document.querySelector(".feed").prepend(el);
  attachDropdownToggle(el);
});

// Include hardcoded posts in the sorting and search logic
document.querySelectorAll(".post-card").forEach((el, index) => {
  el.dataset.id = `hardcoded-${index}`;
  const name = el.querySelector(".user-info h4")?.textContent.trim() || "";
  const profileLink = el.querySelector(".profile-link");

  const likes = parseInt(el.querySelector(".like")?.textContent) || 0;
  const commentCount =
    parseInt(el.querySelector(".comment-count")?.textContent) || 0;
  const title = el.querySelector(".user-info p")?.textContent.trim() || "";
  const description = el.querySelector(".message")?.textContent.trim() || "";

  allPosts.push({
    data: {
      id: `hardcoded-${index}`,
      title,
      description,
      name,
      likes,
      comments: new Array(commentCount).fill("comment"),
      timestamp: Date.now() - Math.floor(Math.random() * 100000),
      shares: 0,
    },
    element: el,
  });

  attachDropdownToggle(el);

  // ✅ Attach modal listener
  if (profileLink) {
    attachProfileModal(profileLink);
  }
});

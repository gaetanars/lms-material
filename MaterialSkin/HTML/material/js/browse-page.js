/*
 * LMS-Material
 *
 * Copyright (c) 2018 Craig Drummond <craig.p.drummond@gmail.com>
 * MIT license.
 */

const PLAY_ACTION             = {title:"Play now",               cmd:"load",      icon:"play_circle_outline"};
const ADD_ACTION              = {title:"Append to queue",        cmd:"add",       icon:"add_circle_outline"};
const RENAME_ACTION           = {title:"Rename",                 cmd:"rename",    icon:"edit"};
const DELETE_ACTION           = {title:"Delete",                 cmd:"delete",    icon:"delete"};
const ADD_TO_FAV_ACTION       = {title:"Add to favourites",      cmd:"addfav",    icon:"favorite"};
const REMOVE_FROM_FAV_ACTION  = {title:"Remove from favourites", cmd:"removefav", icon:"delete_outline"};
const DIVIDER                 = {divider:true};
const SEARCH_TERM_PLACEHOLDER = "XXXXXX";

var lmsBrowse = Vue.component("LmsBrowse", {
    template: `
        <div class="lms-list-page">
          <v-snackbar v-model="showSnackBar" :multi-line="true" :timeout="2500" top>{{ snackbarMsg }}</v-snackbar>
          <v-toolbar v-if="headerTitle" class="browse-details">
            <v-btn flat icon @click="goHome()"><v-icon>home</v-icon></v-btn>
            <v-btn flat icon @click="goBack()"><v-icon>arrow_back</v-icon></v-btn>
            <v-layout row wrap>
              <v-flex class="xs12 toolbar-title">{{headerTitle}}</v-flex>
              <div class="toolbar-subtitle">{{headerSubTitle}}</div>
            </v-layout>
            <v-spacer></v-spacer>
            <template v-for="(action, index) in actions">
              <v-btn flat icon @click.stop="headerAction(action.cmd)" class="browse-header-button"><v-icon>{{action.icon}}</v-icon></v-btn>
            </template>
          </v-toolbar>
          <div v-if="headerTitle" class="browse-pad"></div>
          <v-progress-linear v-if="fetchingItems" :indeterminate="true"></v-progress-linear>
          <v-list>
            <template v-for="(item, index) in items">
              <v-subheader v-if="item.header">{{ item.header }}</v-subheader>

              <v-divider v-else-if="index>0 && !items[index-1].header && (undefined===item.separateArtists || item.separateArtists==separateArtists)" :inset="item.inset"></v-divider>

              <p v-if="item.type=='text'" class="browse-text">
                {{item.title}}
              </p>
              <v-list-tile v-else-if="!item.header && (undefined===item.separateArtists || item.separateArtists==separateArtists)" avatar @click="browse(item)" :key="item.url">
                <v-list-tile-avatar v-if="item.image" :tile="true">
                  <img v-lazy="item.image">
                </v-list-tile-avatar>
                <v-list-tile-avatar v-else-if="item.icon" :tile="true">
                  <v-icon>{{item.icon}}</v-icon>
                </v-list-tile-avatar>

                <v-list-tile-content v-if="item.type!='search' && item.type!='xmlsearch'">
                  <v-list-tile-title v-html="item.title"></v-list-tile-title>
                  <v-list-tile-sub-title v-html="item.subtitle"></v-list-tile-sub-title>
                </v-list-tile-content>

                <v-list-tile-content v-else>
                  <v-text-field single-line clearable :label="item.title" v-on:keyup.enter="search($event, item)"></v-text-field>
                </v-list-tile-content>
                
                <v-list-tile-action v-if="item.actions && 1===item.actions.length" @click.stop="itemAction(item.actions[0].cmd, item)">
                  <v-btn icon ripple>
                    <v-icon>{{item.actions[0].icon}}</v-icon>
                  </v-btn>
                </v-list-tile-action>
                <v-list-tile-action v-if="item.actions && item.actions.length>1" @click.stop=""> <!-- @click.stop stops even going to list item (navigate) -->
                  <v-menu offset-y>
                    <v-btn icon ripple slot="activator">
                      <v-icon>more_vert</v-icon>
                    </v-btn>
                    <v-list>
                      <template v-for="(action, index) in item.actions">
                        <v-divider v-if="action.divider"></v-divider>
                        <v-list-tile v-else @click="itemAction(action.cmd, item)">
                          <v-list-tile-title><v-icon>{{action.icon}}</v-icon>&nbsp;&nbsp;{{action.title}}</v-list-tile-title>
                        </v-list-tile>
                      </template>
                    </v-list>
                  </v-menu>
                </v-list-tile-action>
              </v-list-tile>
            </template>
          </v-list>
        </div>
      `,
    props: [],
    data() {
        return {
            items: [],
            fetchingItems: false,
            snackbarMsg: undefined,
            showSnackBar: false,
            separateArtists: false
        }
    },
    created() {
        this.top = [
            { header: "My Music", url: "top:/mmh" },
            {
                title: "Artists",
                command: ["artists"],
                params: [],
                icon: "group",
                type: "group",
                url: "top:/ar",
            },
            {
                title: "Album Artists",
                command: ["artists"],
                params: ["role_id:ALBUMARTIST"],
                icon: "group",
                type: "group",
                url: "top:/aar",
                separateArtists: true
            },
            {
                title: "Albums",
                command: ["albums"],
                params: ["tags:jlya", "sort:album"], // TODO: Make configurable
                icon: "album",
                type: "group",
                url: "top:/al"
            },
            {
                title: "Genres",
                command: ["genres"],
                icon: "label",
                type: "group",
                url: "top:/ge"
            },
            {
                title: "Playlists",
                command: ["playlists"],
                icon: "list",
                type: "group",
                url: "top:/pl"
            },
            {
                title: "Search",
                command: ["search"],
                params: ["tags:jlyAdt", "extended:1", "term:"+SEARCH_TERM_PLACEHOLDER],
                icon: "search",
                type: "search",
                url: "top:/sr"
            },
            {
                title: "More",
                icon: "more_horiz",
                url: "top:/more",
                type: "group",
            },
            { header: "Other Music", id:"omh" },
            {
                title: "Radio",
                command: ["radios"],
                params: ["want_url:1"],
                icon: "radio",
                type: "group",
                url: "top:/ra"
            },
            {
                title: "Favourites",
                command: ["favorites", "items"],
                params: ["want_url:1"],
                icon: "favorite",
                type: "favorites",
                url: "top:/fa"
            },
            {
                title: "Apps",
                command: ["apps"],
                params: ["want_url:1"],
                icon: "apps",
                type: "group",
                url: "top:/ap"
            }
        ];
        this.other = [
            {
                title: "Composers",
                command: ["artists"],
                params: ["role_id:COMPOSER"],
                icon: "group",
                type: "group",
                url: "more:/comp"
            },
            {
                title: "Conductors",
                command: ["artists"],
                params: ["role_id:CONDUCTOR"],
                icon: "group",
                type: "group",
                url: "more:/cond"
            },   
            {
                title: "Compilations",
                command: ["albums"],
                params: ["compilation:1", "tags:jlya", "sort:album"], // TODO: Make configurable
                icon: "album",
                type: "group",
                url: "more:/co",
            },
            {
                title: "Years",
                command: ["years"],
                icon: "date_range",
                type: "group",
                url: "more:/yr"
            },
            {
                title: "New Music",
                command: "albums",
                params: ["tags:jlya", "sort:new"],
                icon: "new_releases",
                limit: 100,
                type: "group",
                url: "more:/nm"
            },
            /*
            {
                title: "Random Mix",
                command: ["random-mix"],
                icon: "shuffle",
                type: "group",
                url: "more:/rm"
            },*/
          ];
        this.items = this.top;
        this.listSize = this.top.length;
        this.history=[];
        this.fetchingItems = false;
        this.current = null;
        this.headerTitle = null;
        this.headerSubTitle=null;
        this.actions=[];
        this.artistImages=false;
    },
    methods: {
        fetchItems(item, params) {
            this.fetchingItems = true;
            this.current = item;
            //console.log("FETCH command:" + item.command + " params:" + params + " limit:" + item.limit);
            lmsList(this.$store.state.player.id, item.command, params, 0, item.limit).then(({data}) => {
                this.fetchingItems = false;
                var resp = parseBrowseResp(data, item, this.artistImages);

                var prev = {};
                prev.items = this.items;
                prev.listSize = this.listSize;
                prev.current = this.current;
                prev.headerTitle = this.headerTitle;
                prev.headerSubTitle = this.headerSubTitle;
                prev.actions = this.actions;
                prev.pos=document.documentElement.scrollTop;
                this.history.push(prev);
                this.headerTitle=item.title;
                
                if (data && data.result) {
                    this.listSize = data.result.count;
                } else {
                    this.listize = 0;
                }
                this.items=resp.items;
                this.actions=resp.actions;
                if (resp.subtitle) {
                    this.headerSubTitle=resp.subtitle;
                } else {
                    this.headerSubTitle="Total: "+this.listSize;
                }
                document.documentElement.scrollTop=0;
            }).catch(err => {
                this.fetchingItems = false;
                this.snackbarMsg = "Something went wrong!";
                this.showSnackBar = true;
            });
        },
        browse(item) {
            if ("group"!==item.type && "playlist"!==item.type && "favorites"!==item.type) {
                return;
            }
            if ("top:/more"===item.url) {
                var prev = {};
                prev.items = this.items;
                prev.listSize = this.listSize;
                prev.current = this.current;
                prev.headerTitle = this.headerTitle;
                prev.headerSubTitle = this.headerSubTitle;
                prev.actions = this.actions;
                prev.pos=document.documentElement.scrollTop;
                this.history.push(prev);
                this.items = this.other;
                this.headerTitle = item.title;
                this.listSize = this.items.length;
                document.documentElement.scrollTop=0;
                return;
            }
            this.fetchItems(item, item.params);
        },
        search(event, item) {
            if (this.fetchingItems) {
                return;
            }
            var params = [];
            item.params.forEach(p => { params.push(p.replace(SEARCH_TERM_PLACEHOLDER, event.target._value)); });
            this.fetchItems(item, params);
        },
        itemAction(act, item) {
            if (act===RENAME_ACTION.cmd) {
                console.log("RENAME", item);
                // TODO
            } else if (act===DELETE_ACTION.cmd) {
                this.$confirm("Delete '"+item.title+"'?", {buttonTrueText: 'Delete', buttonFalseText: 'Cancel'}).then(res => {
                    if (res) {
                        if (item.url.startsWith("playlist_id:")) {
                            lmsCommand(this.$store.state.player.id, ["playlists", "delete", item.url]).then(({datax}) => {
                                this.refreshList();
                            });
                        }
                    }
                });
            } else if (act===ADD_TO_FAV_ACTION.cmd) {
                // TODO: How to actually add artists, etc?
                lmsCommand(this.$store.state.player.id, ["favorites", "add", item.url, "title:"+item.title]).them(({data})=> {
                    this.snackbarMsg = "Added to favorites!";
                    this.showSnackBar = true;
                }).catch(err => {
                    this.snackbarMsg = "Failed to add to favorites!";
                    this.showSnackBar = true;
                });
            } else if (act===REMOVE_FROM_FAV_ACTION.cmd) {
                this.$confirm("Remove '"+item.title+"' from favourites?", {buttonTrueText: 'Remove', buttonFalseText: 'Cancel'}).then(res => {
                    if (res) {
                        lmsCommand(this.$store.state.player.id, ["favorites", "delete", item.url]).then(({datax}) => {
                            this.refreshList();
                        });
                    }
                });
            } else {
                var command = [];
                if (item.url) {
                    command = ["playlistcontrol", "cmd:"+act, item.url];
                } else if (item.app && item.id) {
                    command = [item.app, "playlist", act, "item_id:"+item.id];
                }

                if (command.length===0) {
                    this.snackbarMsg = "Don't know how to handle this!";
                    this.showSnackBar = true;
                    return;
                }
                lmsCommand(this.$store.state.player.id, command).then(({data}) => {
                    bus.$emit('refreshStatus');
                    if (act===PLAY_ACTION.cmd) {
                        this.$router.push('/nowplaying');
                    } else {
                        this.snackbarMsg = "Added '" + this.current.title + "'";
                        this.showSnackBar = true;
                    }
                });
            }
        },
        headerAction(act) {
            this.itemAction(act, this.current);
        },
        refreshList() {
            var pos=document.documentElement.scrollTop;
            this.fetchingItems = true;
            lmsList(this.$store.state.player.id, this.current.command, this.current.params, 0, this.current.limit).then(({data}) => {
                this.fetchingItems = false;
                var resp = parseBrowseResp(data, this.current, this.artistImages);
                this.headerSubTitle="Total: "+this.listSize;
                if (data && data.result) {
                    this.listSize = data.result.count;
                } else {
                    this.listize = 0;
                }
                this.items=resp.items;
                if (resp.subtitle) {
                    this.headerSubTitle=resp.subtitle;
                }
                
                this.$nextTick(function () {
                    document.documentElement.scrollTop=pos>0 ? pos : 0;
                });
            }).catch(err => {
                this.fetchingItems = false;
                this.snackbarMsg = "Something went wrong!";
                this.showSnackBar = true;
            });
        },
        goHome() {
            if (this.fetchingItems) {
                return;
            }
            var prev = this.history.length>0 ? this.history[0].pos : 0;
            this.items = this.top;
            this.listSize = this.top.length;
            this.history=[];
            this.current = null;
            this.headerTitle = null;
            this.headerSubTitle=null;
            this.actions=[];
            this.$nextTick(function () {
                document.documentElement.scrollTop=prev>0 ? prev : 0 ;
            });
        },
        goBack() {
            if (this.fetchingItems) {
                return;
            }
            if (this.history.length<2) {
                this.goHome();
                return;
            }
            var prev = this.history.pop();
            this.items = prev.items;
            this.listSize = prev.listSize;
            this.current = prev.current;
            this.headerTitle = prev.headerTitle;
            this.headerSubTitle = prev.headerSubTitle;
            this.actions = prev.actions;
            this.$nextTick(function () {
                document.documentElement.scrollTop=prev.pos>0 ? prev.pos : 0;
            });
        },
        scroll () { // Infinite scroll...
            window.onscroll = () => {
                if (this.fetchingItems || !this.items || !this.current || this.listSize<=this.items.length) {
                    return;
                }
                let bottomOfWindow = (document.documentElement.scrollTop + window.innerHeight) >= (document.documentElement.offsetHeight-300);

                if (bottomOfWindow) {
                    this.fetchingItems = true;
                    lmsList(this.$store.state.player.id, this.current.command, this.current.params, this.items.length).then(({data}) => {
                        this.fetchingItems = false;
                        var resp = parseBrowseResp(data, this.current, this.artistImages);
                        if (resp && resp.items) {
                            resp.items.forEach(i => {
                                this.items.push(i);
                            });
                        }
                    }).catch(err => {
                        this.fetchingItems = false;
                    });
                }
            };
        },
    },
    mounted() {
        this.scroll();
        bus.$on('useUnifiedArtistsList', function(useUnifiedArtistsList) {
            this.separateArtists = !useUnifiedArtistsList;
        }.bind(this));

        bus.$on('artistImages', function(artistImages) {
            this.artistImages = artistImages;
        }.bind(this));
    }
});

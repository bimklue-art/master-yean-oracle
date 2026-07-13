import tianJia from "../assets/cards/heaven/tian_jia.png";
import tianYi from "../assets/cards/heaven/tian_yi.png";
import tianBing from "../assets/cards/heaven/tian_bing.png";
import tianDing from "../assets/cards/heaven/tian_ding.png";
import tianWu from "../assets/cards/heaven/tian_wu.png";
import tianJi from "../assets/cards/heaven/tian_ji.png";
import tianGeng from "../assets/cards/heaven/tian_geng.png";
import tianXin from "../assets/cards/heaven/tian_xin.png";
import tianRen from "../assets/cards/heaven/tian_ren.png";
import tianGui from "../assets/cards/heaven/tian_gui.png";

import diYin from "../assets/cards/earth/di_yin.png";
import diMao from "../assets/cards/earth/di_mao.png";
import diChen from "../assets/cards/earth/di_chen.png";
import diSi from "../assets/cards/earth/di_si.png";

import diWu from "../assets/cards/earth/di_wu.png";
import diWei from "../assets/cards/earth/di_wei.png";
import diShen from "../assets/cards/earth/di_shen.png";
import diYou from "../assets/cards/earth/di_you.png";

import diXu from "../assets/cards/earth/di_xu.png";
import diHai from "../assets/cards/earth/di_hai.png";
import diZi from "../assets/cards/earth/di_zi.png";
import diChou from "../assets/cards/earth/di_chou.png";

import renYin from "../assets/cards/human/ren_yin.png";
import renMao from "../assets/cards/human/ren_mao.png";
import renChen from "../assets/cards/human/ren_chen.png";
import renSi from "../assets/cards/human/ren_si.png";

import renWu from "../assets/cards/human/ren_wu.png";
import renWei from "../assets/cards/human/ren_wei.png";
import renShen from "../assets/cards/human/ren_shen.png";
import renYou from "../assets/cards/human/ren_you.png";

import renXu from "../assets/cards/human/ren_xu.png";
import renHai from "../assets/cards/human/ren_hai.png";
import renZi from "../assets/cards/human/ren_zi.png";
import renChou from "../assets/cards/human/ren_chou.png";



export const skyCards = [

{
name:"甲",
image:tianJia
},

{
name:"乙",
image:tianYi
},

{
name:"丙",
image:tianBing
},

{
name:"丁",
image:tianDing
},

{
name:"戊",
image:tianWu
},

{
name:"己",
image:tianJi
},

{
name:"庚",
image:tianGeng
},

{
name:"辛",
image:tianXin
},

{
name:"壬",
image:tianRen
},

{
name:"癸",
image:tianGui
}

];

export const earthCards = [

{
name:"寅",
image:diYin
},

{
name:"卯",
image:diMao
},

{
name:"辰",
image:diChen
},

{
name:"巳",
image:diSi
},

{
name:"午",
image:diWu
},

{
name:"未",
image:diWei
},

{
name:"申",
image:diShen
},

{
name:"酉",
image:diYou
},

{
name:"戌",
image:diXu
},

{
name:"亥",
image:diHai
},

{
name:"子",
image:diZi
},

{
name:"丑",
image:diChou
}

];

export const humanCards = [{
name:"寅",
image:renYin
},

{
name:"卯",
image:renMao
},

{
name:"辰",
image:renChen
},

{
name:"巳",
image:renSi
},

{
name:"午",
image:renWu
},

{
name:"未",
image:renWei
},

{
name:"申",
image:renShen
},

{
name:"酉",
image:renYou
},

{
name:"戌",
image:renXu
},

{
name:"亥",
image:renHai
},

{
name:"子",
image:renZi
},

{
name:"丑",
image:renChou
}

];

export const allCards = [
  ...skyCards,
  ...earthCards,
  ...humanCards,
];

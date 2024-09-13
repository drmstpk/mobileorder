//------------------------------------------------------------------------------
//  クリップボードにコピー
//------------------------------------------------------------------------------
function copyToClipboard(text) {
	navigator.clipboard.writeText(text).then(function() {
	  alert('文章がクリップボードにコピーされました');
	}).catch(function(error) {
	  alert('クリップボードへのコピーに失敗しました: ' + error);
	});
  }
  
  //------------------------------------------------------------------------------
  //  ブラウザのAIが利用できるかチェック
  //------------------------------------------------------------------------------
  let session = false;
  async function check_ai()
  {
	  let ai_available = false;
	  if( window.ai )
	  {
		  const canCreate = await window.ai.canCreateTextSession();
		  if( canCreate !== "no" && canCreate !== "after-download" )
		  {
			  ai_available = true;
		  }
	  }
  
	  if( ai_available )
	  {
		  const chat_area = document.getElementById('chat_area');
		  chat_area.classList.remove('hidden');
		  session = await window.ai.createTextSession();
	  }
	  else
	  {
		  const howto = document.getElementById('howto');
		  howto.classList.remove('hidden');
	  }
  
	  const loading = document.getElementById('loading');
	  loading.classList.add('hidden');
  }
  check_ai();

  //------------------------------------------------------------------------------
  //	応答用メッセージ
  //------------------------------------------------------------------------------
  let message_id = 0;
  const messages =
  [
	  {
		  message: 'こんにちは！\n\nあなたの自己PRの文章作成をサポートします。',
	  },
	  {
		  answer_key: 'gyoukai',
		  message: 'あなたが志望する業界は何ですか？\n（例：IT業界、飲食業界、インフラ）',
	  },
	  {
		  answer_key: 'strength',
		  message: 'あなたの強みを教えてください。\n（例：コミュニケーション能力、統率力、挑戦心、継続力）',
	  },
	  {
		  answer_key: 'experience',
		  message: 'その強みを実感した、具体的な経験・背景・理由を教えてください。\n（例：私が「問題解決力」を実感したのは、チームプロジェクトで進行が遅れた際、タスクの優先順位を変更し、効率的に作業を進めた経験です。その結果、期日内にプロジェクトを完了し、高い評価を得ることができました。）',
	  },
	  {
		  answer_key: 'use',
		  message: 'その経験・強みをどのように生かしたいか教えてください。\n（例：この問題解決能力を、IT企業ではプロジェクトの遅延や技術的な課題に対処する際に活かしたいと考えています。優先順位を柔軟に見直し、効率的にチームを導くことで、スムーズなプロジェクト進行に貢献します。）',
	  },
	  {
		  message: '以下は、あなたの自己PRの例文です。\n\n※生成された文章は、必ずしも正しい文章ではありません。',
		  prompt: '私の強みは、{{strength}}です。\n\n{{experience}}。\n\n{{use}}。\n\nこれらの情報から{{gyoukai}}の企業に対しての、インターンシップの自己PR文を500文字以上の起承転結がはっきりした文章で作成してください。',
	  },
	  {
		  answer_key: 'copy',
		  message:'コピーしたい場合はコピーボタンを押してください'
	  }
  ];
  
  //  利用者の回答
  const answers = {};
  
  //  HTML要素
  const history = document.getElementById('history');
  const send_button = document.getElementById('send_button');
  const answer_textarea = document.getElementById('answer_textarea');
  const generating = document.getElementById('generating');
  let response_text='';
  const sk_circle = document.getElementById('sk-circle');
  
  //------------------------------------------------------------------------------
  //  メッセージの追加
  //------------------------------------------------------------------------------
  function add_message( message_, me_ = false )
  {
	  const balloon = document.createElement('div');
	  balloon.classList.add('balloon');
	  if( me_ )
	  {
		  balloon.classList.add('me');
	  }
	  balloon.textContent = message_;
	  history.appendChild(balloon);
  
	  setTimeout(function()
	  {
		  //  メッセージを表示
		  balloon.classList.add('show');
  
		  //  履歴の最下部にスクロール
		  history.scrollTop = history.scrollHeight;
	  }, 100);
  }
  
  //------------------------------------------------------------------------------
  //  ボットのメッセージを追加
  //------------------------------------------------------------------------------
  async function bot_next_message()
  {
	  const next = messages[message_id];
	  let message = next.message;
	  let prompt = next.prompt;
  
	  //  回答を置換
	  for( const key in answers )
	  {
		  message = message.replace('{{' + key + '}}', answers[key]);
		  if( prompt )
		  {
			  prompt = prompt.replace('{{' + key + '}}', answers[key]);
		  }
	  }
	  add_message(message);
  
	  if( prompt )
	  {
		  generating.classList.remove('hidden');
		  sk_circle.classList.remove('hidden');
		  session.prompt(prompt).then(async function(response)
		  {
			  generating.classList.add('hidden');
			  sk_circle.classList.add('hidden');
			  answers[next.answer_key] = response;
			  add_message(response);
			  response_text=response;
			  message_id++;
			  await bot_next_message();
		  });
		}
  
			  // コピー機能が必要な場合
			  if (next.answer_key === 'copy') {
				  const copyButton = document.createElement('button');
				  copyButton.textContent = 'コピーをする';
				  copyButton.addEventListener('click', function(event) {
					  event.preventDefault();  // リンク遷移を防ぐ
					  copyToClipboard(response_text);  // コピーするテキストを明確に
				  });
				  history.appendChild(copyButton);
			  }
	  
  }
  //------------------------------------------------------------------------------
  //  利用者の回答を追加
  //------------------------------------------------------------------------------
  send_button.addEventListener('click', function()
  {
	  const answer = answer_textarea.value;
	  if( answer.length == 0 )
	  {
		  return;
	  }
	  //  回答を追加
	  const message = messages[message_id];
	  answers[message.answer_key] = answer;
	  add_message(answer, true);
	  answer_textarea.value = '';
  
	  if( message_id < messages.length - 1 )
	  {
		  message_id++;
		  setTimeout(bot_next_message, 500);
	  }
  });
  
  //  初回のメッセージ表示
  bot_next_message();
  setTimeout(function()
  {
	  message_id++;
	  bot_next_message();
  }, 500);
  
  //------------------------------------------------------------------------------
  //  テキストエリアでEnterキーで送信、Shift Enterで改行
  //------------------------------------------------------------------------------
  answer_textarea.addEventListener('keydown', function(e_)
  {
	  if( e_.key === 'Enter' && e_.shiftKey )
	  {
		  return;
	  }
	  else if( e_.key === 'Enter' )
	  {
		  send_button.click();
		  e_.preventDefault();
	  }
  });
  